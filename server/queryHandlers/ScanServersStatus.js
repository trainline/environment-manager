/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let co = require('co');
let moment = require('moment');
let logger = require('modules/logger');
let sender = require('modules/sender');

module.exports = function ScanServersStatusQueryHandler(query) {
  const environment = query.environmentName;

  let allStartTime = moment.utc();

  return Promise.all([
    getAllAsgs(query),
    getAllInstances(environment),
    getAllImages()
  ]).then(results => {

    let allAsgs = results[0];
    let allInstances = results[1];
    let allImages = results[2];

    let asgs = _.filter(allAsgs, (asg) => asg.getTag('Environment') === environment);
    if (query.filter.cluster) {
      asgs = _.filter(asgs, (asg) => asg.getTag('OwningCluster') === query.filter.cluster);
    }
 
	  return Promise.all(asgs.map(asg => {
      let instances = asg.Instances.map(asgInstance => {
        var instance = getInstance(allInstances, asgInstance.InstanceId);

        if (instance && instance.State.Name !== 'terminated') {
          var image = getImage(allImages, instance.ImageId); // TODO(filip): use Image in place of this
          return {
            instanceId: instance.InstanceId,
            name: getTagValue(instance, 'Name'),
            ami: image,
            status: asgInstance.HealthStatus,
          };
        }
      }).filter(instance => !!instance);

      let instanceCount = instances.length;
      let status = getStatus(instances, asg.DesiredCapacity);
      let ami = getAmi(instances);

      return getServicesInstalledOnInstances(environment, instances)
        .then(services => {
          return {
            Name: asg.AutoScalingGroupName,
            Role: asg.getServerRoleName(),
            Status: status,
            Cluster: getTagValue(asg, 'OwningCluster'),
            Schedule: getTagValue(asg, 'Schedule'),
            Size: {
              Current: instanceCount,
              Desired: asg.DesiredCapacity
            },
            Services: services.map(getServiceView(environment)),
            Ami: ami,
          };
        });

    })).then(asgResults => {
      let asgs = asgResults.filter(byStatus(query.filter.status));
      let result = {
        EnvironmentName: environment,
        Value: asgs
      };

      let duration = moment.duration(moment.utc().diff(allStartTime)).asMilliseconds();
      logger.debug(`server-status-query: Whole query took: ${duration}ms`);

      return result;
    });
  });
};

function getServicesInstalledOnInstances(environment, instances) {
  return Promise.all(instances.map(instance => {
    return getConsulServicesForNode(environment, instance.name).then(consulServices => {
      let services = sanitizeConsulServices(consulServices);
      return services;
    });
  })).then(services => {
    let uniqueServices = _.uniqWith(_.flatten(services), _.isEqual);
    return uniqueServices;
  });
}

function getConsulServicesForNode(environment, nodeName) {
  if (!nodeName) return Promise.resolve({}); 
  return sender.sendQuery({
    query: {
      name: 'GetNode',
      environment: environment,
      nodeName: nodeName
    }
  }).then(consulNode => {
    if (!consulNode) return [];
    return consulNode.Services;
  });
}

function getServiceView(env) {
  return service => {

    let regExp = new RegExp(`^${env}-`);
    let nameWithoutPrefix = service.name.replace(regExp, '');
    let name = nameWithoutPrefix.replace(/(-green|-blue)$/, '');

    return {
      Name: service.name,
      FriendlyName: name,
      Version: service.version,
      Slice: service.slice,
    };
  };
}

function getAmi(instances) {
  if (_.some(instances, i => !i.ami)) return;

  let amis = instances.map(i => i.ami);
  let amiNames = _.uniq(amis.map(ami => ami.name));

  if (amiNames.length !== 1) return;
  let ami = amis[0];

  return {
    Name: ami.name,
    Age: moment.utc().diff(moment(ami.created), 'days'),
    IsLatestStable: ami.isLatestStable
  };
}


function getStatus(instances, desiredCapacity) {

  if (_.some(instances, instance => instance.status !== 'Healthy')) {
    return {
      Status: 'Error',
      Reason: 'Not all instances are healthy',
    };
  }

  if (instances.length < desiredCapacity) {
    return {
      Status: 'Warning',
      Reason: 'The number of instances is lower than desired',
    };
  }

  return {
    Status: 'Healthy',
  };
}

function sanitizeConsulServices(consulServices) {
  let keys = _.keys(consulServices);

  return keys.map(key => {

    let obj = {
      name: consulServices[key].Service,
    };

    consulServices[key].Tags.forEach(tag => {
      let parts = tag.split(':');
      obj[parts[0]] = parts[1];
    });

    return obj;
  });
}

function getTagValue(resource, key) {
  if (!resource || !resource.Tags)
    return [];

  let tags = resource.Tags.filter(tag => {
    return tag.Key === key;
  });

  return (tags.length > 0) ? tags[0].Value : '';
}

function getImage(images, imageId) {
  let foundImages = images.filter(image => {
    return image.ImageId === imageId;
  });

  if (foundImages.length === 0) return;

  let image = foundImages[0];

  return {
    name: image.Name,
    created: image.CreationDate,
    isLatestStable: image.IsLatest && image.IsStable
  };
}

function getInstance(instances, instanceId) {
  return instances.filter(instance => {
    return instance.InstanceId === instanceId;
  })[0];
}

function byStatus(status) {
  return resource => {
    if (!status) return true;
    return resource.Status.toLowerCase() == status.toLowerCase();
  };
}

function byTag(key, value) {
  return resource => {
    if (!value) return true;
    return _.some(resource.Tags, tag => {
      return tag.Key === key &&
        tag.Value.toLowerCase() === value.toLowerCase();
    });
  };
}

function getAllAsgs(query) {
  let startTime = moment.utc();

  return sender.sendQuery({
    query: {
      name: 'ScanAutoScalingGroups',
      accountName: query.accountName,
    },
  }).then(result => {
    let duration = moment.duration(moment.utc().diff(startTime)).asMilliseconds();
    logger.debug(`server-status-query: AllAsgsQuery took ${duration}ms`);
    return result;
  });
}

function getAllInstances(environment) {
  let startTime = moment.utc();

  let filter = {};
  filter['tag:Environment'] = environment;

  return sender.sendQuery({
    query: {
      name: 'ScanCrossAccountInstances',
      filter: filter,
    },
  }).then(result => {
    let duration = moment.duration(moment.utc().diff(startTime)).asMilliseconds();
    logger.debug(`server-status-query: InstancesQuery took ${duration}ms`);
    return result;
  });
}

function getAllImages() {
  let startTime = moment.utc();

  return sender.sendQuery({
    query: {
      name: 'ScanCrossAccountImages',
    },
  }).then(result => {
    let duration = moment.duration(moment.utc().diff(startTime)).asMilliseconds();
    logger.debug(`server-status-query: AllImagesQuery took ${duration}ms`);
    return result;
  });
}
