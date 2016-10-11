/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').controller('ManageEnvironmentScheduleController',
  function ($rootScope, $routeParams, $location, $q, modal, resources, cachedResources, configValidation, cron, Environment) {
    var vm = this;

    vm.environment = {};
    vm.operations = {};
    vm.operationsVersion = 0;
    vm.dataFound = false;
    vm.dataLoading = true;

    vm.newSchedule = {
      Type: '',
      DefaultSchedule: '',
    };

    function init() {

      var environmentName = GetActiveEnvironment();
      vm.environment.EnvironmentName = environmentName;

      vm.refresh();
    }

    vm.refresh = function () {

      vm.dataLoading = true;

      function assignToTheScope(operations) {

        vm.operations = operations;
        vm.operationsVersion = operations.Version;

        var scheduleAction = GetScheduleAction(operations.Value);
        vm.operations.getScheduleAction = function () {
          return scheduleAction; };

        vm.newSchedule = {
          DefaultSchedule: operations.Value.DefaultSchedule,
          Type: operations.Value.ScheduleAutomatically ? 'Automatic' : operations.Value.ManualScheduleUp ? 'On' : 'Off',
        };

      };

      Environment.getScheduleStatus(vm.environment.EnvironmentName)
        .then(function (operations) {
          assignToTheScope(operations);
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

    vm.applySchedule = function () {

      // Update Environment with form values
      vm.operations.Value.ScheduleAutomatically = vm.newSchedule.Type == 'Automatic';
      vm.operations.Value.ManualScheduleUp = vm.newSchedule.Type == 'On';
      vm.operations.Value.DefaultSchedule = vm.newSchedule.DefaultSchedule;

      var params = {
        key: vm.operations.EnvironmentName,
        expectedVersion: vm.operationsVersion,
        data: {
          Value: vm.operations.Value,
        },
      };
      Environment.putSchedule(vm.operations.EnvironmentName, vm.operationsVersion, vm.operations.Value).then(function () {
        cachedResources.config.environments.flush();
        modal.information({
          title: 'Environment Schedule Updated',
          message: 'Environment schedule saved successfully.<br/><br/>Note: It may take up to 10 minutes for schedule changes to result in servers being turned on or off.',
        }).then(function () {
          vm.refresh();
        });
      });
    };

    function GetScheduleAction(data) {
      function GetCurrentSchedule() {
        if (data.ScheduleAutomatically === false) {
          if (data.ManualScheduleUp === true) return '247';
          if (data.ManualScheduleUp === false) return 'OFF';
        }

        return data.DefaultSchedule;
      }

      var schedule = GetCurrentSchedule();
      return cron.getActionBySchedule(schedule);
    }

    function GetActiveEnvironment() {
      var environmentName = $routeParams['environment'];
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
