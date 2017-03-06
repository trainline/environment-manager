/* TODO: enable linting and fix resulting errors */
/* TODO: All the scheduling code should be removed from here at some point */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments').controller('ManageEnvironmentSettingsController',
  function ($rootScope, $routeParams, $location, $http, $q, modal, resources, cachedResources, Environment) {
    var vm = this;

    vm.environment = {};
    vm.environmentVersion = 0;
    vm.dataFound = false;
    vm.dataLoading = true;
    vm.owningClustersList = [];
    vm.deploymentMapsList = [];
    vm.alertSettingsList = resources.environmentAlertSettingsList;
    vm.enableLockChanges = false;

    vm.newEnvironment = {
      OwningCluster: '',
      DeploymentMap: '',
      Description: '',
      IsLocked: false
    };

    function init() {
      var environmentName = getActiveEnvironment();
      vm.environment.EnvironmentName = environmentName;

      vm.userHasPermission = user.hasPermission({ access: 'PUT', resource: '/config/environments/' + environmentName });
      vm.enableLockChanges = user.hasPermission({
        access:'PUT',
        resource: '/config/environments/' + environmentName + '/locks' // This is only exposed to ADMIN users
      });

      $q.all([
        $http.get('/api/v1/config/notification-settings').then(function (response) {
          vm.notificationSettingsList = response.data;
        }),

        cachedResources.config.clusters.all().then(function (clusters) {
          vm.owningClustersList = _.map(clusters, 'ClusterName').sort();
        }),

        cachedResources.config.deploymentMaps.all().then(function (deploymentMaps) {
          vm.deploymentMapsList = _.map(deploymentMaps, 'DeploymentMapName');
        })
      ]).then(function () {
        vm.refresh();
      });
    }

    vm.canUser = function () {
      return vm.userHasPermission;
    };

    vm.refresh = function () {
      vm.dataLoading = true;
      
      resources.config.environments.get({ key: vm.environment.EnvironmentName })
      .then(function (configuration) {
        vm.environment = configuration;
        vm.environmentVersion = configuration.Version;

        vm.newEnvironment = {
          OwningCluster: configuration.Value.OwningCluster,
          DeploymentMap: configuration.Value.DeploymentMap,
          Description: configuration.Value.Description,
          AlertSettings: configuration.Value.AlertSettings,
          NotificationSettingsId: configuration.Value.NotificationSettingsId,
          IsLocked: configuration.Value.IsLocked
        };
        vm.dataFound = true;
      }, function () {
        vm.dataFound = false;
      }).finally(function () {
        vm.dataLoading = false;
      });
    };

    vm.save = function () {
      // Update Environment with form values
      vm.environment.Value.OwningCluster = vm.newEnvironment.OwningCluster;
      vm.environment.Value.DeploymentMap = vm.newEnvironment.DeploymentMap;
      vm.environment.Value.Description = vm.newEnvironment.Description;
      vm.environment.Value.AlertSettings = vm.newEnvironment.AlertSettings;
      vm.environment.Value.NotificationSettingsId = vm.newEnvironment.NotificationSettingsId;
      vm.environment.Value.IsLocked = vm.newEnvironment.IsLocked;

      var params = {
        key: vm.environment.EnvironmentName,
        expectedVersion: vm.environmentVersion,
        data: vm.environment.Value
      };
      resources.config.environments.put(params).then(function () {
        cachedResources.config.environments.flush();
        modal.information({
          title: 'Environment Settings Saved',
          message: 'Environment settings saved successfully.'
        }).then(function () {
          vm.refresh();
        });
      });
    };

    function getActiveEnvironment() {
      var environmentName = $routeParams.environment;
      if (environmentName) {
        // Environment specified on URL, override active environment
        $rootScope.WorkingEnvironment.EnvironmentName = environmentName;
      } else {
        // Nothing specified, read currently active environment and update URL to match
        environmentName = $rootScope.WorkingEnvironment.EnvironmentName;
        $location.search('environment', environmentName);
      }

      return environmentName;
    }

    init();
  });

