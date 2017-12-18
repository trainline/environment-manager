/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let co = require('co');
let topicNotificationMappingProvider = require('./autoScaling/topicNotificationMappingProvider');
let namingConventionProvider = require('./namingConventionProvider');
let subnetsProvider = require('./autoScaling/subnetsProvider');
let tagsProvider = require('./autoScaling/tagsProvider');

module.exports = {
  get(configuration, accountName) {
    assert(configuration, 'Expected \'configuration\' argument not to be null.');

    return co(function* () {
      let sliceNames = configuration.serverRole.FleetPerSlice ? ['blue', 'green'] : [null];
      let topicNotificationMapping = yield topicNotificationMappingProvider.get(accountName);
      let subnets = yield subnetsProvider.get(configuration);
      let templates = [];

      for (let index = 0; index < sliceNames.length; index++) {
        let sliceName = sliceNames[index];

        let autoScalingGroupName = namingConventionProvider.getAutoScalingGroupName(
          configuration, sliceName
        );

        let launchConfigurationName = namingConventionProvider.getLaunchConfigurationName(
          configuration, sliceName
        );

        let tags = yield tagsProvider.get(configuration, sliceName);

        templates.push({
          autoScalingGroupName,
          launchConfigurationName,
          size: {
            min: configuration.serverRole.AutoScalingSettings.MinCapacity,
            desired: configuration.serverRole.AutoScalingSettings.DesiredCapacity,
            max: configuration.serverRole.AutoScalingSettings.MaxCapacity
          },
          scaling: {
            terminationDelay: configuration.serverRole.TerminationDelay
          },
          subnets,
          tags,
          topicNotificationMapping
        });
      }

      return templates;
    });
  }
};
