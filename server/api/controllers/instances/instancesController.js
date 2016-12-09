/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let co = require('co');
let ScanInstances = require('queryHandlers/ScanInstances');
let ScanCrossAccountInstances = require('queryHandlers/ScanCrossAccountInstances');
let EnterAutoScalingGroupInstancesToStandby = require('commands/asg/EnterAutoScalingGroupInstancesToStandby');
let ExitAutoScalingGroupInstancesFromStandby = require('commands/asg/ExitAutoScalingGroupInstancesFromStandby');
let DynamoHelper = require('api/api-utils/DynamoHelper');
let Instance = require('models/Instance');
let dynamoHelper = new DynamoHelper('asgips');
let serviceTargets = require('modules/service-targets');
let logger = require('modules/logger');
let getInstanceState = require('modules/environment-state/getInstanceState');
let Environment = require('models/Environment');
let Enums = require('Enums');
let DEPLOYMENT_STATUS = Enums.DEPLOYMENT_STATUS;

/**
 * GET /instances
 */
function getInstances(req, res, next) {
  let accountName = req.swagger.params.account.value;
  const cluster = req.swagger.params.cluster.value;
  const environmentName = req.swagger.params.environment.value;
  const maintenance = req.swagger.params.maintenance.value;
  const ipAddress = req.swagger.params.ip_address.value;
  const instanceId = req.swagger.params.instance_id.value;
  const since = req.swagger.params.since.value;
  const includeDeploymentsStatus = req.swagger.params.include_deployments_status.value;

  co(function* () {
    let filter = {};

    if (cluster !== undefined) {
      filter['tag:OwningCluster'] = cluster;
    }
    if (environmentName !== undefined) {
      filter['tag:Environment'] = environmentName;
      if (accountName === undefined) {
        accountName = yield Environment.getAccountNameForEnvironment(environmentName);
      }
    }
    if (maintenance === true) {
      filter['tag:Maintenance'] = 'true';
    }
    if (ipAddress !== undefined) {
      filter['private-ip-address'] = ipAddress;
    }
    if (instanceId !== undefined) {
      filter['instance-id'] = instanceId;
    }
    // TODO(Filip): consider adding filter on launch-time for improved performance
    // if (since !== undefined) {
    //   filter['launch-time'] = Instance.createLaunchTimeArraySince(since);
    // }

    if (_.isEmpty(filter)) {
      filter = null;
    }

    let handler = accountName !== undefined ? ScanInstances : ScanCrossAccountInstances;
    let list = yield handler({ accountName, filter });

    // Note: be wary of performance - this filters instances AFTER fetching all from AWS
    if (since !== undefined) {
      let sinceDate = new Date(since);
      list = _.filter(list, (instance) => {
        return sinceDate.getTime() < new Date(instance.LaunchTime).getTime();
      })
    }

    if (includeDeploymentsStatus === true) {
      list = yield _.map(list, (instance) => {
        let instanceEnvironment = instance.getTag('Environment', null);

        instance.appendTagsToObject();

        let instanceName = instance.getTag('Name', null);
        let instanceRoleTag = instance.getTag('Role', null);

        if (instanceName === null || instanceName === '' || instanceEnvironment === null || instanceRoleTag === null) {
          // This instance won't be returned
          return false;
        }

        // If instances were fetched by cross scan, instance.AccountName is available, otherwise, for simple scan use accountName
        return getInstanceState(instance.AccountName || accountName, instanceEnvironment, instanceName, instance.InstanceId, instanceRoleTag, instance.LaunchTime)
          .then((state) => {
            _.assign(instance, state);
            return instance;
          });
      });

      // Remove instances without Environment tag
      list = _.compact(list);
      list = _.sortBy(list, (instance) => new Date(instance.LaunchTime)).reverse();
      res.json(list);
    } else {
      res.json(list);
    }
  }).catch(next);
}

/**
 * GET /instances/{id}
 */
function getInstanceById(req, res, next) {
  const id = req.swagger.params.id.value;
  Instance.getById(id).then(instance => res.json(instance)).catch(next);
}

/**
 * PUT /instances/{id}/maintenance
 */
function putInstanceMaintenance(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  const enable = body.enable;

  co(function* () {

    let instance = yield Instance.getById(id);
    const instanceIds = [id];
    const accountName = instance.AccountName;
    const autoScalingGroupName = instance.getAutoScalingGroupName();
    const environmentName = instance.getTag('Environment');

    /**
     * Update ASG IPS table (previously done in separate end point through ASG IPs resource)
     *
     * TODO(filip): handle case when MAINTENANCE_MODE entry doesn't exist - need to create entry
     */
    let entry = yield dynamoHelper.getByKey('MAINTENANCE_MODE', { accountName });
    let ips = JSON.parse(entry.IPs);
    if (enable === true) {
      ips.push(instance.PrivateIpAddress)
      ips = _.uniq(ips);
    } else {
      _.pull(ips, instance.PrivateIpAddress);
    }
    yield dynamoHelper.update('MAINTENANCE_MODE', { IPs: JSON.stringify(ips) }, entry.Version, req.user, { accountName });

    /**
     * Put instance to standby on AWS
     */
    let handler = enable ? EnterAutoScalingGroupInstancesToStandby : ExitAutoScalingGroupInstancesFromStandby;
    try {
      yield handler({ accountName, autoScalingGroupName, instanceIds });
    } catch (err) {
      if (err.message.indexOf('is not in Standby') !== -1 || err.message.indexOf('cannot be exited from standby as its LifecycleState is InService') !== -1) {
        logger.warn(`ASG ${autoScalingGroupName} instance ${id} is already in desired state for ASG Standby: ${enable}`)
      } else {
        throw err;
      }
    }

    yield instance.persistTag({ key: 'Maintenance', value: enable.toString() });

    /**
     * Now switch Maintenance mode (previously done in separate end point)
     */
    serviceTargets.setInstanceMaintenanceMode(accountName, instance.PrivateIpAddress, environmentName, enable);

    res.send({ ok: true });
  }).catch(next);
}

module.exports = {
  getInstances,
  getInstanceById,
  putInstanceMaintenance
};
