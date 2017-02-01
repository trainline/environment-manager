/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments').controller('ManageEnvironmentSettingsController',
  function ($rootScope, $routeParams, $location, $http, $q, modal, resources, cachedResources, cron, Environment) {
    var vm = this;

    vm.environment = {};
    vm.environmentVersion = 0;
    vm.operations = {};
    vm.operationsVersion = 0;
    vm.dataFound = false;
    vm.dataLoading = true;
    vm.owningClustersList = [];
    vm.deploymentMapsList = [];
    vm.alertSettingsList = resources.environmentAlertSettingsList;
    vm.enableLockChanges = false;

    vm.newEnvironment = {
      OwningCluster: '',
      DeploymentMap: '',
      CodeDeployBucket: '',
      Description: '',
      IsLocked: false
    };

    vm.newSchedule = {
      Type: '',
      DefaultSchedule: ''
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

      function assignToTheScope(configuration, operations) {
        vm.environment = configuration;
        vm.environmentVersion = configuration.Version;

        vm.operations = operations;
        vm.operationsVersion = operations.Version;

        var scheduleAction = getScheduleAction(operations.Value);
        vm.operations.getScheduleAction = function () { return scheduleAction; };

        vm.newEnvironment = {
          OwningCluster: configuration.Value.OwningCluster,
          DeploymentMap: configuration.Value.DeploymentMap,
          CodeDeployBucket: configuration.Value.CodeDeployBucket,
          Description: configuration.Value.Description,
          AlertSettings: configuration.Value.AlertSettings,
          NotificationSettingsId: configuration.Value.NotificationSettingsId,
          IsLocked: configuration.Value.IsLocked
        };

        vm.newSchedule = {
          DefaultSchedule: operations.Value.DefaultSchedule,
          Type: operations.Value.ScheduleAutomatically ? 'Automatic' : operations.Value.ManualScheduleUp ? 'On' : 'Off'
        };
      }
      
      $q.all([
        resources.config.environments.get({ key: vm.environment.EnvironmentName }),
        Environment.getSchedule(vm.environment.EnvironmentName)
      ]).then(function (results) {
        var configuration = results[0];
        var operations = results[1];
        assignToTheScope(configuration, operations);

        vm.dataFound = true;
      }, function () {
        vm.dataFound = false;
      }).finally(function () {
        vm.dataLoading = false;
      });
    };

    vm.useSpecificClicked = function () {
      if (!vm.newSchedule.DefaultSchedule || vm.newSchedule.DefaultSchedule.indexOf(':') == -1) {
        vm.newSchedule.DefaultSchedule = 'Start: 0 8 * * 1,2,3,4,5; Stop: 0 19 * * 1,2,3,4,5';
        vm.editing = true;
      }
    };

    vm.nonSpecificClicked = function () {
      vm.editing = false;
    };

    vm.doneClicked = function () {
      vm.editing = false;
      if (vm.newSchedule.DefaultSchedule.indexOf(':') == -1) {
        vm.newSchedule.Type = 'On';
      }
    };

    vm.shouldShowEditor = function () {
      return vm.newSchedule.Type == 'Automatic' && vm.editing == true;
    };

    vm.editClicked = function () {
      vm.editing = true;
    };

    vm.save = function () {
      // Update Environment with form values
      vm.environment.Value.OwningCluster = vm.newEnvironment.OwningCluster;
      vm.environment.Value.DeploymentMap = vm.newEnvironment.DeploymentMap;
      vm.environment.Value.CodeDeployBucket = vm.newEnvironment.CodeDeployBucket;
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

    vm.applySchedule = function () {
      // Update Environment with form values
      vm.operations.Value.ScheduleAutomatically = vm.newSchedule.Type == 'Automatic';
      vm.operations.Value.ManualScheduleUp = vm.newSchedule.Type == 'On';
      vm.operations.Value.DefaultSchedule = vm.newSchedule.DefaultSchedule;

      var params = {
        key: vm.operations.EnvironmentName,
        expectedVersion: vm.operationsVersion,
        data: {
          Value: vm.operations.Value
        }
      };
      resources.ops.environments.put(params).then(function () {
        cachedResources.config.environments.flush();
        modal.information({
          title: 'Environment Schedule Updated',
          message: 'Environment schedule saved successfully.<br/><br/>Note: It may take up to 10 minutes for schedule changes to result in servers being turned on or off.'
        }).then(function () {
          vm.refresh();
        });
      });
    };

    function getScheduleAction(data) {
      function getCurrentSchedule() {
        if (data.ScheduleAutomatically === false) {
          if (data.ManualScheduleUp === true) return 'ON';
          if (data.ManualScheduleUp === false) return 'OFF';
        }

        return data.DefaultSchedule;
      }

      var schedule = getCurrentSchedule();
      return cron.getActionBySchedule(schedule);
    }

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

