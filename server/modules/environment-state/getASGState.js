/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let fp = require('lodash/fp');
let co = require('co');

let getInstanceState = require('./getInstanceState');
let getServicesState = require('./getServicesState');
let getAWSInstances = require('./getAWSInstances');

let AutoScalingGroup = require('models/AutoScalingGroup');
let logger = require('modules/logger');
let Environment = require('models/Environment');
let Enums = require('Enums');
let DIFF_STATE = Enums.DIFF_STATE;
let HEALTH_STATUS = Enums.HEALTH_STATUS;


function getServicesSummary(services) {
  let present = _.filter(services, (service) => {
    let diff = service.DiffWithTargetState;
    return diff !== DIFF_STATE.Missing && diff !== DIFF_STATE.Extra && diff !== DIFF_STATE.Ignored;
  });

  let presentWithUnexpected = _.filter(services, (service) => {
    let diff = service.DiffWithTargetState;
    return diff !== DIFF_STATE.Missing && diff !== DIFF_STATE.Ignored;
  });

  let total = _.filter(services, (service) => {
    // Services with 'Extra' diff state are present on some instances, but not in target state, typically because they're Ignored
    let diff = service.DiffWithTargetState;
    return diff !== DIFF_STATE.Extra && diff !== DIFF_STATE.Ignored;
  });

  let presentAndHealthy = _.filter(present, (s) => s.OverallHealth.Status === HEALTH_STATUS.Healthy);

  let missing = _.filter(services, { DiffWithTargetState: DIFF_STATE.Missing });
  let ignored = _.filter(services, { DiffWithTargetState: DIFF_STATE.Ignored });

  return {
    AllServicesPresent: present.length === total.length,
    AllServicesPresentAndHealthy: presentAndHealthy.length === total.length,
    ServicesCount: {
      Present: present.length,
      PresentWithUnexpected: presentWithUnexpected.length,
      PresentAndHealthy: presentAndHealthy.length,
      Ignored: ignored.length,
      Total: total.length
    },
    PresentServices: fp.map(fp.pick(['Name', 'Slice', 'Version']), present),
    MissingServices: fp.map(fp.pick(['Name', 'Slice', 'Version']), missing)
  };
}

module.exports = function getASGState(environmentName, asgName) {
  return co(function* () {
    const accountName = yield (yield Environment.getByName(environmentName)).getAccountName();
    let asg = yield AutoScalingGroup.getByName(accountName, asgName);

    let instancesIds = _.map(asg.Instances, 'InstanceId');
    let instances = yield getAWSInstances(accountName, instancesIds);

    let instancesStates = yield _.map(instances, (instance) => {
      // Fresh instances might not have initialised tags yet - don't merge state when that happens
      if (instance.Name !== undefined) {
        return getInstanceState(accountName, environmentName, instance.Name, instance.InstanceId, instance.Role);
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
};
