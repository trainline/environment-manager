/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let namingConventionProvider = require('modules/provisioning/namingConventionProvider');
let ConfigurationError = require('modules/errors/ConfigurationError.class');

module.exports = {
  get(configuration, sliceName) {
    assert(configuration, 'Expected \'configuration\' argument not to be null');
    let roleName = namingConventionProvider.getRoleName(configuration, sliceName);
    let tags = {
      EnvironmentType: configuration.environmentTypeName,
      Environment: configuration.environmentName,
      OwningCluster: configuration.cluster.Name,
      OwningClusterShortName: configuration.cluster.ShortName,
      Role: roleName,
      SecurityZone: configuration.serverRole.SecurityZone,
      Schedule: configuration.serverRole.ScheduleTag || '',
      ContactEmail: configuration.serverRole.ContactEmailTag
    };

    if (!tags.ContactEmail) {
      return Promise.reject(new ConfigurationError('Missing \'ContactEmail\' tag in configuration.'));
    }

    return Promise.resolve(tags);
  }
};
