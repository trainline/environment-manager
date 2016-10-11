/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

﻿angular.module('EnvironmentManager.common').factory('accountMappingService',
  function ($q, cachedResources, $http) {
    return {
      getAccountForEnvironment: function (environmentName) {
        var url = '/api/v1/environments/' + environmentName + '/accountName';

        return $http.get(url).then(function(account) {
          return account.data;
        }, function(error) {
          throw error.message;
        });
      },

      getEnvironmentLoadBalancers: function (environmentName) {
        var environments;
        var environmentTypes;
        var runningInSandbox = false;

        return $q.all([
          cachedResources.config.accounts.all().then(function (accounts) {
            accounts = _.map(accounts, 'AccountName');
            runningInSandbox = (accounts.indexOf('Sandbox') != -1);
          }),

          cachedResources.config.environments.all().then(function (envData) {
            environments = envData;
          }),

          cachedResources.config.environmentTypes.all().then(function (envTypesData) {
            environmentTypes = envTypesData;
          }),
        ]).then(function () {

          var env = cachedResources.config.environments.getByName(environmentName, 'EnvironmentName', environments);
          var envTypeName = runningInSandbox ? 'Sandbox' : env.Value.EnvironmentType;
          var envType = cachedResources.config.environmentTypes.getByName(envTypeName, 'EnvironmentType', environmentTypes);

          if (!env) {
            throw 'Environment name ' + environmentName + ' not found';
          } else if (!envType) {
            throw 'Environment type ' + envTypeName + ' not found';
          } else {
            return envType.Value.LoadBalancers;
          }

        });
      }
    };
  });
