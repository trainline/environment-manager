/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');

let AwsError = require('modules/errors/AwsError.class');
let LaunchConfigurationAlreadyExistsError = require('modules/errors/LaunchConfigurationAlreadyExistsError.class');

// TODO(filip): don't define methods in constructor, convert to class
function LaunchConfigurationResource(client) {
  this.client = client;

  function cleanup(launchconfig) {
    delete launchconfig.LaunchConfigurationARN;
    delete launchconfig.CreatedTime;

    if (_.isNull(launchconfig.KernelId) || _.isEmpty(launchconfig.KernelId)) delete launchconfig.KernelId;
    if (_.isNull(launchconfig.RamdiskId) || _.isEmpty(launchconfig.RamdiskId)) delete launchconfig.RamdiskId;
  }

  function standardifyError(error, launchConfigurationName) {
    if (!error) return null;

    let awsError = new AwsError(error.message);

    if (error.code === 'AlreadyExists') {
      return new LaunchConfigurationAlreadyExistsError(
        `LaunchConfiguration "${launchConfigurationName}" already exists`, awsError
      );
    }

    return awsError;
  }

  function describeLaunchConfigurations(names) {
    let launchconfigs = [];
    let request = {};

    if (names.length) {
      request.LaunchConfigurationNames = names;
    }

    function query() {
      return client.describeLaunchConfigurations(request).promise().then((data) => {
        launchconfigs = launchconfigs.concat(data.LaunchConfigurations);

        if (!data.NextToken) return launchconfigs;

        // Scan from next index
        request.NextToken = data.NextToken;
        return query();
      });
    }

    return query();
  }

  this.get = function (parameters) {
    return describeLaunchConfigurations([parameters.name]).then(data => data[0]);
  };

  this.all = function (parameters) {
    return describeLaunchConfigurations(parameters.names || []);
  };

  this.delete = function ({ name }) {
    let request = { LaunchConfigurationName: name };

    return client.deleteLaunchConfiguration(request).promise().catch((error) => {
      throw standardifyError(error, name);
    });
  };

  this.post = function (parameters) {
    cleanup(parameters);

    let request = parameters;
    return client.createLaunchConfiguration(request).promise().catch((error) => {
      throw standardifyError(error, parameters.LaunchConfigurationName);
    });
  };
}

module.exports = {

  canCreate: resourceDescriptor =>
    resourceDescriptor.type.toLowerCase() === 'launchconfig',

  create: (resourceDescriptor, parameters) =>
    amazonClientFactory.createASGClient(parameters.accountName).then(client => new LaunchConfigurationResource(client)),
};
