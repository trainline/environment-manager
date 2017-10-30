/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let moment = require('moment');
let co = require('co');
let sender = require('../modules/sender');
let EnvironmentType = require('./EnvironmentType');
let Environment = require('./Environment');
let serviceTargets = require('../modules/service-targets');
const asgResourceFactory = require('../modules/resourceFactories/asgResourceFactory');
const launchConfigurationResourceFactory = require('../modules/resourceFactories/launchConfigurationResourceFactory');
let logger = require('../modules/logger');
let TaggableMixin = require('./TaggableMixin');
let GetAutoScalingGroup = require('../queryHandlers/GetAutoScalingGroup');
let ScanAutoScalingGroups = require('../queryHandlers/ScanAutoScalingGroups');

class AutoScalingGroup {

  constructor(data) {
    _.assign(this, data);
  }

  getLaunchConfiguration() {
    let self = this;
    return co(function* () {
      let name = self.LaunchConfigurationName;
      if (name === undefined) {
        throw new Error(`Launch configuration doesn't exist for ${self.AutoScalingGroupName}`);
      }
      let client = yield launchConfigurationResourceFactory.create(undefined, { accountName: self.$accountName });
      return client.get({ name });
    });
  }

  getEnvironmentType() {
    return EnvironmentType.getByName(this.getTag('EnvironmentType'));
  }

  getRuntimeServerRoleName() {
    return this.getTag('Role');
  }

  deleteASG() {
    let environmentName = this.getTag('Environment');
    let self = this;
    return co(function* () {
      let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
      let asgResource = yield asgResourceFactory.create(undefined, { accountName });
      let launchConfigResource = yield launchConfigurationResourceFactory.create(undefined, { accountName });
      logger.info(`Deleting AutoScalingGroup ${self.AutoScalingGroupName} and associated Launch configuration ${self.LaunchConfigurationName}`);

      yield asgResource.delete({ name: self.AutoScalingGroupName, force: true });
      if (self.LaunchConfigurationName !== undefined) {
        // If not present it means that this ASG is already being deleted
        yield launchConfigResource.delete({ name: self.LaunchConfigurationName });
      }

      yield serviceTargets.removeRuntimeServerRoleTargetState(environmentName, self.getRuntimeServerRoleName());
      return true;
    });
  }

  static getAllByServerRoleName(environmentName, serverRoleName) {
    return AutoScalingGroup.getAllByEnvironment(environmentName)
      .then(asgs => _.filter(asgs, asg => asg.getTag('Role') === serverRoleName));
  }

  static getByName(accountName, autoScalingGroupName) {
    return co(function* () {
      let query = {
        name: 'GetAutoScalingGroup',
        accountName,
        autoScalingGroupName
      };

      let data = yield sender.sendQuery(GetAutoScalingGroup, { query });
      data.$accountName = accountName;
      data.$autoScalingGroupName = autoScalingGroupName;
      return data;
    });
  }

  static getAllByEnvironment(environmentName) {
    return co(function* () {
      let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
      let startTime = moment.utc();

      return sender.sendQuery(ScanAutoScalingGroups, {
        query: {
          name: 'ScanAutoScalingGroups',
          accountName
        }
      }).then((result) => {
        let duration = moment.duration(moment.utc().diff(startTime)).asMilliseconds();
        logger.debug(`server-status-query: AllAsgsQuery took ${duration}ms`);
        return _.filter(result, asg => asg.getTag('Environment', '') === environmentName);
      });
    });
  }

}

module.exports = TaggableMixin(AutoScalingGroup);
