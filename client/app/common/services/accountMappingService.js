/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

﻿angular.module('EnvironmentManager.common').factory('accountMappingService',
  function ($q, cachedResources, $http) {

    function accountMappingService() {

      this.GetAccountForEnvironment = function (environmentName) {
        var deferred = $q.defer();
        var url = '/api/environments/' + environmentName + '/accountName';

        $http.get(url).then(function(account) {
          deferred.resolve(account.data)
        }, function(error) {
          deferred.reject(error.message);
        });
        return deferred.promise;
      };

      this.GetEnvironmentLoadBalancers = function (environmentName) {
        var deferred = $q.defer();

        var environments;
        var environmentTypes;
        var runningInSandbox = false;

        $q.all([
          cachedResources.aws.accounts.all().then(function (accounts) {
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
            deferred.reject('Environment name ' + environmentName + ' not found');
          } else if (!envType) {
            deferred.reject('Environment type ' + envTypeName + ' not found');
          } else {
            deferred.resolve(envType.Value.LoadBalancers);
          }

        });

        return deferred.promise;
      };

    }

    return new accountMappingService();
  });
