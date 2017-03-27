/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

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
let ScanInstancesScheduleStatus = require('queryHandlers/ScanInstancesScheduleStatus');
let fp = require('lodash/fp');
let merge = require('modules/merge');

/* The tags that should be added to each instance as properties.
 * If the instance already has a property with one of these names
 * its value will be replaced with an array containing the value of
 * the tag and the original value of the property. It will not be
 * overwritten.
 * */
const FLATTEN_TAGS = [
  'aws:autoscaling:groupName',
  'ContactEmail',
  'Environment',
  'EnvironmentType',
  'Name',
  'OwningCluster',
  'OwningClusterShortName',
  'Role',
  'Schedule',
  'SecurityZone'
];

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

    if (_.isEmpty(filter)) {
      filter = null;
    }

    let handler = accountName !== undefined ? ScanInstances : ScanCrossAccountInstances;
    let list = yield handler({ accountName, filter });

    // Note: be wary of performance - this filters instances AFTER fetching all from AWS
    if (since !== undefined) {
      let sinceDate = new Date(since);
      list = _.filter(list, (instance) => {
        if (instance.CreationTime === undefined) {
          return true;
        }
        return sinceDate.getTime() < new Date(instance.CreationTime).getTime();
      });
    }

    if (includeDeploymentsStatus === true) {
      if (list.length > Enums.DEPLOYMENT_INSTANCES_LIST_MAXIMUM_LENGTH) {
        throw new Error(`Too many results: ${list.length}. Please refine your search query, ie. choose later since date, or limit query to one environment`);
      }

      list = yield _.map(list, (instance) => {
        let instanceEnvironment = instance.getTag('Environment', null);
        let instanceName = instance.getTag('Name', null);
        let instanceRoleTag = instance.getTag('Role', null);

        if ([instanceEnvironment, instanceName, instanceRoleTag].some(x => x === null || x === '')) {
          // This instance won't be returned
          logger.warn(`One of the tags [Environment, Name, Role] is not set. The EC2 instance will be skipped. ${instance.InstanceId}.`);
          return false;
        }

        let tagsToFlatten = fp.flow(
          fp.map(name => [name, instance.getTag(name, null)]),
          fp.filter(([, value]) => value !== null && value !== undefined),
          fp.fromPairs
        )(FLATTEN_TAGS);

        // If instances were fetched by cross scan, instance.AccountName is available, otherwise, for simple scan use accountName
        return getInstanceState(
          instance.AccountName || accountName,
          instanceEnvironment, instanceName, instance.InstanceId, instanceRoleTag, instance.LaunchTime, null)
          .then((state) => {
            return merge(instance, state, tagsToFlatten);
          }, (error) => {
            logger.error(error);
            return false;
          });
      });

      // Remove instances without Environment tag
      list = _.compact(list);
      list = _.sortBy(list, instance => new Date(instance.LaunchTime)).reverse();
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
     * Update ASG IPS table
     */
    let entry = yield dynamoHelper.getByKey('MAINTENANCE_MODE', { accountName });
    let ips = JSON.parse(entry.IPs);
    if (enable === true) {
      ips.push(instance.PrivateIpAddress);
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
        logger.warn(`ASG ${autoScalingGroupName} instance ${id} is already in desired state for ASG Standby: ${enable}`);
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

/**
 * GET /instances/{id}/connect
 */
function connectToInstance(req, res, next) {
  const id = req.swagger.params.id.value;
  Instance.getById(id).then((instance) => {
    res.status(200);
    res.set({
      'content-type': 'application/rdp',
      'content-disposition': `attachment; filename*=UTF-8''${id}.rdp`
    });
    res.send(`full address:s:${instance.PrivateIpAddress}`);
  }).catch(next);
}

/**
 * GET /instances/schedule-actions
 */
function getScheduleActions(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const dateTime = req.swagger.params.date.value;

  let query = {
    name: 'ScanInstancesScheduleStatus',
    accountName,
    dateTime
  };

  ScanInstancesScheduleStatus(query)
    .then(actions => res.json(actions))
    .catch(next);
}

module.exports = {
  getInstances,
  getInstanceById,
  putInstanceMaintenance,
  connectToInstance,
  getScheduleActions
};
