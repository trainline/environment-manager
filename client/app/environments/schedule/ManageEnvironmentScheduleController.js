/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').controller('ManageEnvironmentScheduleController',
  function ($rootScope, $routeParams, $location, $q, modal, resources, cachedResources, configValidation, cron, Environment) {

    var PROTECTED_ACTION = 'SCHEDULE_ENVIRONMENT';

    var vm = this;
    vm.Environment = {};
    vm.EnvironmentVersion = 0;
    vm.Operations = {};
    vm.OperationsVersion = 0;
    vm.DataFound = false;
    vm.DataLoading = true;
    vm.schedulingProtected = false;

    vm.NewSchedule = {
      Type: '',
      DefaultSchedule: '',
    };

    function init() {
      var environmentName = GetActiveEnvironment();
      vm.Environment.EnvironmentName = environmentName;

      resources.environment(environmentName).isProtectedAgainstAction(PROTECTED_ACTION).then(function(isProtected) {
        vm.schedulingProtected = isProtected;
        vm.Refresh();
      });
    }

    vm.Refresh = function () {
      vm.DataLoading = true;

      function assignToTheScope(operations) {
        vm.Operations = operations;
        vm.OperationsVersion = operations.Version;

        var scheduleAction = GetScheduleAction(operations.Value);
        vm.Operations.getScheduleAction = function () { return scheduleAction; };

        vm.NewSchedule = {
          DefaultSchedule: operations.Value.DefaultSchedule,
          Type: operations.Value.ScheduleAutomatically ? 'Automatic' : operations.Value.ManualScheduleUp ? 'On' : 'Off',
        };
      };

      Environment.getSchedule(vm.Environment.EnvironmentName)
        .then(function (operations) {
          assignToTheScope(operations);
          vm.DataFound = true;
        }, function () {

          vm.DataFound = false;
        }).finally(function () {
          vm.DataLoading = false;
        });
    };

    vm.UseSpecificClicked = function () {
      if (!vm.NewSchedule.DefaultSchedule || vm.NewSchedule.DefaultSchedule.indexOf(':') == -1) {
        vm.NewSchedule.DefaultSchedule = 'Start: 0 8 * * 1,2,3,4,5; Stop: 0 19 * * 1,2,3,4,5';
        vm.editing = true;
      }
    };

    vm.NonSpecificClicked = function () {
      vm.editing = false;
    };

    vm.DoneClicked = function () {
      vm.editing = false;
      if (vm.NewSchedule.DefaultSchedule.indexOf(':') == -1) {
        vm.NewSchedule.Type = 'On';
      }
    };

    vm.ShouldShowEditor = function () {
      return vm.NewSchedule.Type == 'Automatic' && vm.editing == true;
    };

    vm.EditClicked = function () {
      vm.editing = true;
    };

    vm.ApplySchedule = function () {

      // Update Environment with form values
      vm.Operations.Value.ScheduleAutomatically = vm.NewSchedule.Type == 'Automatic';
      vm.Operations.Value.ManualScheduleUp = vm.NewSchedule.Type == 'On';
      vm.Operations.Value.DefaultSchedule = vm.NewSchedule.DefaultSchedule;

      var params = {
        key: vm.Operations.EnvironmentName,
        expectedVersion: vm.OperationsVersion,
        data: {
          Value: vm.Operations.Value,
        },
      };
      resources.ops.environments.put(params).then(function () {
        cachedResources.config.environments.flush();
        modal.information({
          title: 'Environment Schedule Updated',
          message: 'Environment schedule saved successfully.<br/><br/>Note: It may take up to 10 minutes for schedule changes to result in servers being turned on or off.',
        }).then(function () {
          vm.Refresh();
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
