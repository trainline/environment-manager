/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

﻿angular.module('EnvironmentManager.common').factory('accountMappingService',
  function ($q, cachedResources, $http) {
    return {
      getAccountForEnvironment: function (environmentName) {
        var url = '/api/v1/environments/' + environmentName;

        return $http.get(url).then(function (account) {
          return account.data.Value.AccountName;
        }, function (error) {
          throw error.message;
        });
      },
      getEnvironmentLoadBalancers: function (environmentName) {
        var environments;
        var environmentTypes;

        return $q.all([
          cachedResources.config.environments.all().then(function (envData) {
            environments = envData;
          }),

          cachedResources.config.environmentTypes.all().then(function (envTypesData) {
            environmentTypes = envTypesData;
          })
        ]).then(function () {
          var env = cachedResources.config.environments.getByName(environmentName, 'EnvironmentName', environments);
          if (!env) throw 'Environment name ' + environmentName + ' not found';

          var envTypeName = env.Value.EnvironmentType;
          var envType = cachedResources.config.environmentTypes.getByName(envTypeName, 'EnvironmentType', environmentTypes);
          if (!envType) throw 'Environment type ' + envTypeName + ' not found';

          return envType.Value.LoadBalancers;
        });
      }
    };
  });
