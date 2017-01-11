/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let namingConventionProvider = require('modules/provisioning/namingConventionProvider');
let userDataBuilder = require('modules/provisioning/launchConfiguration/UserDataBuilder');

module.exports = {
  get(configuration, image, sliceName) {
    assert(configuration, 'Expected \'configuration\' argument not to be null');
    assert(image, 'Expected \'image\' argument not to be null');

    let userData = image.platform === 'Windows' ?
      getWindowsUserData(configuration, sliceName) :
      getLinuxUserData(configuration, sliceName);
    return userData;
  }
};

function getLinuxUserData(configuration, sliceName) {
  let roleName = namingConventionProvider.getRoleName(configuration, sliceName);
  let parameters = {
    EnvironmentType: configuration.environmentTypeName,
    Environment: configuration.environmentName,
    SecurityZone: configuration.serverRole.SecurityZone,
    OwningCluster: configuration.cluster.Name,
    Role: roleName,
    ContactEmail: configuration.serverRole.ContactEmailTag,
    ProjectCode: configuration.serverRole.ProjectCodeTag,
    PuppetRole: configuration.serverRole.PuppetRole
  };

  return userDataBuilder.buildLinuxUserData(parameters);
}

function getWindowsUserData(configuration, sliceName) {
  let roleName = namingConventionProvider.getRoleName(configuration, sliceName);
  let parameters = {
    EnvironmentType: configuration.environmentTypeName,
    Environment: configuration.environmentName,
    SecurityZone: configuration.serverRole.SecurityZone,
    OwningCluster: configuration.cluster.Name,
    Role: roleName,
    ContactEmail: configuration.serverRole.ContactEmailTag,
    ProjectCode: configuration.serverRole.ProjectCodeTag,
    RemovalDate: configuration.serverRole.RemovalDateTag,
    PuppetRole: configuration.serverRole.PuppetRole
  };

  return userDataBuilder.buildWindowsUserData(parameters);
}
