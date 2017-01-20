/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.configuration').factory('lbBulkOperationService',
  function ($q, resources, accountMappingService) {
    function LoadBalancerBulkOperationService() {
      this.CloneLBSettings = function (envSource, envTarget) {
        alert('CLONE');

        // Read rules for source environment

        // Process rules replacing environment name
        // Cope with weird E15 -> St1 etc mapping
        // Delete all rules in target
        // Insert copies of new rules
      };

      this.DeleteAllLBSettings = function (accountName, environment, data) {
        $q.all(
          data.forEach(function (lbSetting) {
            return DeleteLBSetting(accountName, environment, lbSetting.VHostName);
          })
        ).finally(function () {
          // TODO: return promise
          cachedResources.config.lbSettings.flush();
        });
      };

      function DeleteLBSetting(accountName, environment, vHostName) {
        var params = {
          account: accountName,
          key: environment,
          range: vHostName
        };
        return resources.config.lbSettings.delete(params);
      }
    }

    return new LoadBalancerBulkOperationService();
  });

