/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').controller('ManageEnvironmentScheduleController',
  function ($rootScope, $scope, $routeParams, $location, $q, modal, resources, cachedResources, configValidation, cron, Environment) {

    $scope.Environment = {};
    $scope.EnvironmentVersion = 0;
    $scope.Operations = {};
    $scope.OperationsVersion = 0;
    $scope.DataFound = false;
    $scope.DataLoading = true;

    $scope.NewSchedule = {
      Type: '',
      DefaultSchedule: '',
    };

    function init() {

      var environmentName = GetActiveEnvironment();
      $scope.Environment.EnvironmentName = environmentName;

      $scope.Refresh();
    }

    $scope.Refresh = function () {

      $scope.DataLoading = true;

      function assignToTheScope(operations) {

        $scope.Operations = operations;
        $scope.OperationsVersion = operations.Version;

        var scheduleAction = GetScheduleAction(operations.Value);
        $scope.Operations.getScheduleAction = function () {
          return scheduleAction; };

        $scope.NewSchedule = {
          DefaultSchedule: operations.Value.DefaultSchedule,
          Type: operations.Value.ScheduleAutomatically ? 'Automatic' : operations.Value.ManualScheduleUp ? 'On' : 'Off',
        };

      };

      Environment.getScheduleStatus($scope.Environment.EnvironmentName)
        .then(function (operations) {
          assignToTheScope(operations);
          $scope.DataFound = true;
        }, function () {

          $scope.DataFound = false;
        }).finally(function () {
          $scope.DataLoading = false;
        });
    };

    $scope.UseSpecificClicked = function () {
      if (!$scope.NewSchedule.DefaultSchedule || $scope.NewSchedule.DefaultSchedule.indexOf(':') == -1) {
        $scope.NewSchedule.DefaultSchedule = 'Start: 0 8 * * 1,2,3,4,5; Stop: 0 19 * * 1,2,3,4,5';
        $scope.editing = true;
      }
    };

    $scope.NonSpecificClicked = function () {
      $scope.editing = false;
    };

    $scope.DoneClicked = function () {
      $scope.editing = false;
      if ($scope.NewSchedule.DefaultSchedule.indexOf(':') == -1) {
        $scope.NewSchedule.Type = 'On';
      }
    };

    $scope.ShouldShowEditor = function () {
      return $scope.NewSchedule.Type == 'Automatic' && $scope.editing == true;
    };

    $scope.EditClicked = function () {
      $scope.editing = true;
    };

    $scope.ApplySchedule = function () {

      // Update Environment with form values
      $scope.Operations.Value.ScheduleAutomatically = $scope.NewSchedule.Type == 'Automatic';
      $scope.Operations.Value.ManualScheduleUp = $scope.NewSchedule.Type == 'On';
      $scope.Operations.Value.DefaultSchedule = $scope.NewSchedule.DefaultSchedule;

      var params = {
        key: $scope.Operations.EnvironmentName,
        expectedVersion: $scope.OperationsVersion,
        data: {
          Value: $scope.Operations.Value,
        },
      };
      Environment.putSchedule($scope.Operations.EnvironmentName, $scope.OperationsVersion, $scope.Operations.Value).then(function () {
        cachedResources.config.environments.flush();
        modal.information({
          title: 'Environment Schedule Updated',
          message: 'Environment schedule saved successfully.<br/><br/>Note: It may take up to 10 minutes for schedule changes to result in servers being turned on or off.',
        }).then(function () {
          $scope.Refresh();
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
