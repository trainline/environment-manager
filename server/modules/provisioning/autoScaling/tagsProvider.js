/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let namingConventionProvider = require('../namingConventionProvider');
let ConfigurationError = require('../../errors/ConfigurationError.class');

module.exports = {
  get(configuration, sliceName) {
    assert(configuration, 'Expected \'configuration\' argument not to be null');
    let roleName = namingConventionProvider.getRoleName(configuration, sliceName);
    let legacyTags = {
      OwningCluster: configuration.cluster.Name,
      OwningClusterShortName: configuration.cluster.ShortName
    };
    let tags = {
      EnvironmentType: configuration.environmentTypeName,
      Environment: configuration.environmentName,
      OwningTeam: configuration.cluster.Name,
      Role: roleName,
      SecurityZone: configuration.serverRole.SecurityZone,
      Schedule: configuration.serverRole.ScheduleTag || '',
      ContactEmail: configuration.serverRole.ContactEmailTag
    };

    if (!tags.ContactEmail) {
      return Promise.reject(new ConfigurationError('Missing \'ContactEmail\' tag in configuration.'));
    }

    return Promise.resolve(Object.assign({}, legacyTags, tags));
  }
};
