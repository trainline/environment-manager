/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let co = require('co');
let moment = require('moment');
let logger = require('modules/logger');
let sender = require('modules/sender');
let Environment = require('models/Environment');
let AutoScalingGroup = require('models/AutoScalingGroup');
let Instance = require('models/Instance');

module.exports = co.wrap(ScanServersStatusQueryHandler);

function* ScanServersStatusQueryHandler(query) {
  const environmentName = query.environmentName;
  const accountName = yield Environment.getAccountNameForEnvironment(environmentName);

  let allStartTime = moment.utc();

  return Promise.all([
    AutoScalingGroup.getAllByEnvironment(environmentName),
    Instance.getAllByEnvironment(environmentName),
    getAllImages(),
  ]).then((results) => {
    let asgs = results[0];
    let allInstances = results[1];
    let allImages = results[2];

    if (query.filter.cluster) {
      asgs = _.filter(asgs, asg => asg.getTag('OwningCluster') === query.filter.cluster);
    }

    return Promise.all(asgs.map((asg) => {
      let instances = asg.Instances.map((asgInstance) => {
        let instance = _.find(allInstances, { InstanceId: asgInstance.InstanceId });

        if (instance && instance.State.Name !== 'terminated') {
          let image = getImage(allImages, instance.ImageId); // TODO(filip): use Image in place of this
          return {
            instanceId: instance.InstanceId,
            name: instance.getTag('Name', ''),
            ami: image,
            status: asgInstance.HealthStatus,
          };
        } else {
          return null;
        }
      }).filter(instance => !!instance);

      let instanceCount = instances.length;
      let status = getStatus(instances, asg.DesiredCapacity);
      let ami = getAmi(instances);

      return getServicesInstalledOnInstances(environmentName, instances)
        .then(services => ({
          Name: asg.AutoScalingGroupName,
          Role: asg.getRuntimeServerRoleName(),
          Status: status,
          Cluster: asg.getTag('OwningCluster', ''),
          Schedule: asg.getTag('Schedule', ''),
          IsBeingDeleted: asg.Status === 'Delete in progress',
          Size: {
            Current: instanceCount,
            Desired: asg.DesiredCapacity,
          },
          Services: services.map(getServiceView(environmentName)),
          Ami: ami,
        }));
    })).then((asgResults) => {
      let filteredAsgs = asgResults.filter(byStatus(query.filter.status));
      let result = {
        EnvironmentName: environmentName,
        Value: filteredAsgs,
      };

      let duration = moment.duration(moment.utc().diff(allStartTime)).asMilliseconds();
      logger.debug(`server-status-query: Whole query took: ${duration}ms`);

      return result;
    });
  });
}

function getServicesInstalledOnInstances(environment, instances) {
  // eslint-disable-next-line arrow-body-style
  return Promise.all(instances.map((instance) => {
    return getConsulServicesForNode(environment, instance.name).then((consulServices) => {
      let services = sanitizeConsulServices(consulServices);
      return services;
    });
  })).then((services) => {
    let uniqueServices = _.uniqWith(_.flatten(services), _.isEqual);
    return uniqueServices;
  });
}

function getConsulServicesForNode(environment, nodeName) {
  if (!nodeName) return Promise.resolve({});
  return sender.sendQuery({
    query: {
      name: 'GetNode',
      environment,
      nodeName,
    },
  }).then((consulNode) => {
    if (!consulNode) return [];
    return consulNode.Services;
  });
}

function getServiceView(env) {
  return (service) => {
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
  if (_.some(instances, i => !i.ami)) return null;

  let amis = instances.map(i => i.ami);
  let amiNames = _.uniq(amis.map(ami => ami.name));

  if (amiNames.length !== 1) return;
  let ami = amis[0];

  return {
    Name: ami.name,
    Age: moment.utc().diff(moment(ami.created), 'days'),
    IsLatestStable: ami.isLatestStable,
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

  return keys.map((key) => {
    let obj = {
      name: consulServices[key].Service,
    };

    consulServices[key].Tags.forEach((tag) => {
      let parts = tag.split(':');
      obj[parts[0]] = parts[1];
    });

    return obj;
  });
}

function getImage(images, imageId) {
  let foundImages = images.filter(image => image.ImageId === imageId);
  if (foundImages.length === 0) return null;

  let image = foundImages[0];

  return {
    name: image.Name,
    created: image.CreationDate,
    isLatestStable: image.IsLatest && image.IsStable,
  };
}

function byStatus(status) {
  return function (resource) {
    if (!status) return true;
    return resource.Status.toLowerCase() === status.toLowerCase();
  };
}

function getAllImages() {
  let startTime = moment.utc();

  return sender.sendQuery({
    query: {
      name: 'ScanCrossAccountImages',
    },
  }).then((result) => {
    let duration = moment.duration(moment.utc().diff(startTime)).asMilliseconds();
    logger.debug(`server-status-query: AllImagesQuery took ${duration}ms`);
    return result;
  });
}

