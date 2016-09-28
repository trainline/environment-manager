/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let SecurityGroup = require('models/SecurityGroup');
let _ = require('lodash');

/**
 * These returns SecurityGroups in format
 * [ {Id, Name} ] where Id is AWS Secuity Group Id, and Name is a Tag:Name of an AWS Security Group
 */
module.exports = {

  getFromSecurityGroupNames: function (accountName, vpcId, securityGroupNamesAndReasons, logger) {
    let securityGroupNames = [];
    let securityGroupNamesAndReasonsMapping = {};

    securityGroupNamesAndReasons.forEach(group => {
      securityGroupNames.push(group.name);
      securityGroupNamesAndReasonsMapping[group.name] = group.reason;
    });

    return SecurityGroup.getAllByNames(accountName, vpcId, securityGroupNames)
      .then(securityGroups =>
        getAndVerifyAllExpectedSecurityGroups(securityGroups, vpcId, securityGroupNamesAndReasonsMapping, logger)
      );
  },

  getFromConfiguration: function (configuration, image, accountName, logger) {
    assert(configuration, 'Expected "configuration" argument not to be null');
    assert(image, 'Expected "image" argument not to be null');
    assert(accountName, 'Expected "accountName" argument not to be null');

    let vpcId = configuration.environmentType.VpcId;
    let securityGroupNamesAndReasons = getSecurityGroupsNamesAndReasons(configuration, image);

    return this.getFromSecurityGroupNames(accountName, vpcId, securityGroupNamesAndReasons, logger);
  },

};

function getAndVerifyAllExpectedSecurityGroups(securityGroups, vpcId, securityGroupNamesAndReasonsMapping, logger) {

  let atLeastOneFound = false;
  for (let securityGroupName in securityGroupNamesAndReasonsMapping) {
    let found = _.find(securityGroups, sg => sg.getName() === securityGroupName);
    if (found === undefined) {
      logger.warn(`Security group "${securityGroupName}" not found in "${vpcId}" VPC. ` +
        securityGroupNamesAndReasonsMapping[securityGroupName]
      );
    } else {
      atLeastOneFound = true;
    }
  }

  if (atLeastOneFound === false) {
    let errorMessage = `You need at least 1 SecurityGroup to start an ASG`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  return securityGroups;
}

function getSecurityGroupsNamesAndReasons(configuration, image) {

  let cluster = configuration.cluster;
  let imagePlatform = image.platform;
  let securityZone = configuration.serverRole.SecurityZone;
  let serverRoleName = configuration.serverRole.ServerRoleName;
  let customSecurityGroups = configuration.serverRole.SecurityGroups || [];

  let securityGroupNamesAndReasons = [];

  if (customSecurityGroups.length) {
    customSecurityGroups.forEach(group => securityGroupNamesAndReasons.push({
      name: group,
      reason: 'It is assigned because specified in the server role configuration.',
    }));
  } else {
    securityGroupNamesAndReasons.push({
      name: getSecurityGroupNameByServerRole(cluster, serverRoleName),
      reason: 'It is assigned by default given server role and cluster. It can be overwritten ' +
              'by specifying one or more security groups in the server role configuration.',
    });
  }

  if (securityZone === 'Secure') {
    securityGroupNamesAndReasons.push({
      name: getSecurityGroupNameBySecurityZone(securityZone),
      reason: 'It is assigned by default because server role security zone is Secure.',
    });

    securityGroupNamesAndReasons.push({
      name: getSecurityGroupNameByPlatformSecure(image, securityZone),
      reason: `It is assigned by default because instances image is ${imagePlatform} based in ` +
              'Secure security zone.',
    });
  } else {

    securityGroupNamesAndReasons.push({
      name: getSecurityGroupNameByPlatform(image, securityZone),
      reason: `It is assigned by default because instances image is ${imagePlatform} based.`,
    });

  }

  return securityGroupNamesAndReasons;
}


function getSecurityGroupNameByPlatform(image) {
  return `sgOS${image.platform}`;
}

function getSecurityGroupNameByPlatformSecure(image) {
  return `sgOS${image.platform}Secure`;
}

function getSecurityGroupNameByServerRole(cluster, serverRoleName) {
  return `sgRole${cluster.Name}${serverRoleName}`;
}

function getSecurityGroupNameBySecurityZone(securityZone) {
  return `sgZone${securityZone}`;
}
