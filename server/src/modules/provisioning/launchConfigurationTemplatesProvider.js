/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let co = require('co');

let namingConventionProvider = require('./namingConventionProvider');
let iamInstanceProfileNameProvider = require('./launchConfiguration/iamInstanceProfileNameProvider');
let instanceDevicesProvider = require('./launchConfiguration/instanceDevicesProvider');
let securityGroupsProvider = require('./launchConfiguration/securityGroupsProvider');
let userDataProvider = require('./launchConfiguration/userDataProvider');
let keyNameProvider = require('./launchConfiguration/keyNameProvider');
let imageProvider = require('./launchConfiguration/imageProvider');

module.exports = {
  get(configuration, accountName, logger) {
    assert(configuration, 'Expected \'configuration\' argument not to be null.');
    assert(accountName, 'Expected \'accountName\' argument not to be null.');

    return co(function* () {
      let sliceNames = configuration.serverRole.FleetPerSlice ? ['blue', 'green'] : [null];

      let image = yield imageProvider.get(configuration.serverRole.AMI);
      let keyName = yield keyNameProvider.get(configuration, accountName);
      let iamInstanceProfile = yield iamInstanceProfileNameProvider.get(configuration, accountName);
      let securityGroups = yield securityGroupsProvider.getFromConfiguration(configuration, image, accountName, logger);
      let devices = instanceDevicesProvider.toAWS(configuration.serverRole.Volumes);
      let detailedMonitoring = isDetailedMonitoringEnabled(configuration);
      let templates = [];

      for (let index = 0; index < sliceNames.length; index++) {
        let sliceName = sliceNames[index];
        let userData = yield userDataProvider.get(configuration, image, sliceName);
        let launchConfigurationName = namingConventionProvider.getLaunchConfigurationName(
          configuration, sliceName
        );
        let instanceType = configuration.serverRole.InstanceType;

        templates.push({
          launchConfigurationName,
          image,
          instanceType,
          keyName,
          detailedMonitoring,
          iamInstanceProfile,
          securityGroups,
          devices,
          userData
        });
      }

      return templates;
    });
  }
};

function isDetailedMonitoringEnabled(configuration) {
  let environmentTypeName = (configuration.environmentTypeName || '').toLowerCase();
  let detailedMonitoringEnabled = environmentTypeName === 'prod';
  return detailedMonitoringEnabled;
}
