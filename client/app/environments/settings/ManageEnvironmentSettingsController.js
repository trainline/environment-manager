/* TODO: enable linting and fix resulting errors */
/* TODO: All the scheduling code should be removed from here at some point */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments').controller('ManageEnvironmentSettingsController',
  function ($rootScope, $routeParams, $location, $http, $q, modal, resources, cachedResources, Environment, upstreamservice) {
    var vm = this;

    vm.environment = {};
    vm.environmentVersion = 0;
    vm.dataFound = false;
    vm.dataLoading = true;
    vm.owningClustersList = [];
    vm.deploymentMapsList = [];
    vm.alertSettingsList = resources.environmentAlertSettingsList;
    vm.enableLockChanges = false;
    vm.enableMaintenanceChanges = false;

    vm.newEnvironment = {
      OwningCluster: '',
      DeploymentMap: '',
      Description: '',
      IsLocked: false,
      InMaintenance: false
    };

    function init() {
      var environmentName = getActiveEnvironment();
      vm.environment.EnvironmentName = environmentName;

      vm.userHasPermission = user.hasPermission({ access: 'PUT', resource: '/config/environments/' + environmentName });
      vm.enableLockChanges = user.hasPermission({ access: 'PUT', resource: '/environments/' + environmentName + '/deploy-lock' });
      vm.enableMaintenanceChanges = user.hasPermission({ access: 'PUT', resource: '/environments/' + environmentName + '/maintenance' });

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

    vm.resetCache = function () {
      return resetCacheConfirmationModal(vm.environment.EnvironmentName)
        .then(function () { return upstreamservice.all(); })
          .catch(function (e) {
            // handle the cancel action
          });
    };

    function resetCacheConfirmationModal() {
      return modal.confirmation({
        title: 'WARNING!!! Resetting cache for all services in ' + vm.environment.EnvironmentName,
        message:
        'Are you sure you want to reset the cache for each service in <strong>' + vm.environment.EnvironmentName + '</strong>?<br />',
        action: 'Reset Cache',
        severity: 'Danger',
        acknowledge: 'I am sure I want to reset the cache for each service in  ' + vm.environment.EnvironmentName + '.'
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
          };
        })
        .then(function () {
          return $q.all([
            $http.get('/api/v1/environments/' + vm.environment.EnvironmentName + '/deploy-lock').then(function (response) {
              vm.environment.Value.IsLocked = response.data.Value.DeploymentsLocked;
              vm.newEnvironment.IsLocked = response.data.Value.DeploymentsLocked;
              vm.opsVersion = response.data.Version;
            }),
            $http.get('/api/v1/environments/' + vm.environment.EnvironmentName + '/maintenance').then(function (response) {
              vm.environment.Value.InMaintenance = response.data.Value.InMaintenance;
              vm.newEnvironment.InMaintenance = response.data.Value.InMaintenance;
              vm.opsVersion = response.data.Version;
            })
          ]);
        })
        .then(function () {
          vm.dataFound = true;
        })
        .catch(function () {
          vm.dataFound = false;
        })
        .finally(function () {
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

      var params = {
        key: vm.environment.EnvironmentName,
        expectedVersion: vm.environmentVersion,
        data: vm.environment.Value
      };
      resources.config.environments.put(params).then(function () {
        cachedResources.config.environments.flush();
      }).then(function () {
        if (vm.newEnvironment.IsLocked !== vm.environment.Value.IsLocked) {
          return $http({
            method: 'PUT',
            url: '/api/v1/environments/' + vm.environment.EnvironmentName + '/deploy-lock',
            data: { DeploymentsLocked: vm.newEnvironment.IsLocked },
            headers: { 'expected-version': vm.opsVersion }
          }).then(function () { vm.opsVersion += 1; });
        }
      }).then(function () {
        if (vm.newEnvironment.InMaintenance !== vm.environment.Value.InMaintenance) {
          var setMaintenanceMode = function () {
            return $http({
              method: 'PUT',
              url: '/api/v1/environments/' + vm.environment.EnvironmentName + '/maintenance',
              data: { InMaintenance: vm.newEnvironment.InMaintenance },
              headers: { 'expected-version': vm.opsVersion }
            }).then(function () { vm.opsVersion += 1; });
          };
          if (vm.newEnvironment.InMaintenance === true) {
            return modal.confirmation({
              title: 'WARNING!!! Putting Environment into Maintenance',
              message:
              'Are you sure you want to put environment <strong>' + vm.environment.EnvironmentName + '</strong> in to Maintenance?<br />' +
              'This will take down ALL sites in this environment!!',
              action: 'Enter Maintenance',
              severity: 'Danger',
              acknowledge: 'I am sure I want to put ' + vm.environment.EnvironmentName + ' in to Maintenance!'
            }).then(setMaintenanceMode);
          }
          return setMaintenanceMode();
        }
      }).then(function () {
        return modal.information({
          title: 'Environment Settings Saved',
          message: 'Environment settings saved successfully.'
        });
      }).finally(function () {
        vm.refresh();
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

