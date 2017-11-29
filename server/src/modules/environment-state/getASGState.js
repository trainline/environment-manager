/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let fp = require('lodash/fp');
let co = require('co');

let getInstanceState = require('./getInstanceState');
let getServicesState = require('./getServicesState');
let getAWSInstances = require('./getAWSInstances');

let AutoScalingGroup = require('../../models/AutoScalingGroup');
let logger = require('../logger');
let Environment = require('../../models/Environment');
let Enums = require('../../Enums');
let DIFF_STATE = Enums.DIFF_STATE;
let HEALTH_STATUS = Enums.HEALTH_STATUS;

// Services with 'Extra' diff state are present on some instances, but not in target state, typically because they're Ignored
function getServicesSummary(services) {
  let expected = _.filter(services, (service) => {
    let diff = service.DiffWithTargetState;
    return diff !== DIFF_STATE.Unexpected && diff !== DIFF_STATE.Ignored;
  });

  let expectedAndHealthy = _.filter(expected, s => s.OverallHealth === HEALTH_STATUS.Healthy);

  let unexpected = _.filter(services, { DiffWithTargetState: DIFF_STATE.Unexpected });
  let missing = _.filter(services, { DiffWithTargetState: DIFF_STATE.Missing });
  let ignored = _.filter(services, { DiffWithTargetState: DIFF_STATE.Ignored });

  return {
    AllExpectedServicesPresent: missing.length === 0,
    AllExpectedServicesHealthy: expectedAndHealthy.length === expected.length,
    ServicesCount: {
      Expected: expected.length,
      Unexpected: unexpected.length,
      Missing: missing.length,
      Ignored: ignored.length
    },
    ExpectedServices: fp.map(fp.pick(['Name', 'Slice', 'Version']), expected),
    MissingServices: fp.map(fp.pick(['Name', 'Slice', 'Version']), missing)
  };
}

function getASGState(environmentName, asgName) {
  return co(function* () {
    const accountName = yield (yield Environment.getByName(environmentName)).getAccountName();
    let asg = yield AutoScalingGroup.getByName(accountName, asgName);

    let instancesIds = _.map(asg.Instances, 'InstanceId');
    let instances = yield getAWSInstances(accountName, instancesIds);

    let instancesStates = yield _.map(instances, (instance) => {
      // Fresh instances might not have initialised tags yet - don't merge state when that happens
      if (instance.Name !== undefined) {
        return getInstanceState(accountName, environmentName, instance.Name, instance.InstanceId, instance.Role, instance.LaunchTime);
      } else {
        logger.warn(`Instance ${instance.InstanceId} name tag is undefined`);
        return {};
      }
    });

    _.forEach(instances, (instance, index) => {
      // Copy ASG instance data
      let asgInstance = _.find(asg.Instances, { InstanceId: instance.InstanceId });
      instance.LifecycleState = asgInstance.LifecycleState;

      // Copy ASG state data
      _.assign(instance, instancesStates[index]);
    });

    let services = yield getServicesState(environmentName, asg.getRuntimeServerRoleName(), instances);

    let response = getServicesSummary(services);
    _.assign(response, {
      Services: services,
      Instances: instances
    });

    return response;
  });
}

getASGState.getServicesSummary = getServicesSummary;

module.exports = getASGState;
