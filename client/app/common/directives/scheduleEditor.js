/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .directive('scheduleEditor', function () {
    return {
      restrict: 'E',
      scope: {
        schedule: '=',
        showOn: '=',
        showOff: '=',
        showDefault: '=',
        showSpecific: '=',
      },
      templateUrl: '/app/common/directives/scheduleEditor.html',
      controller: function ($scope) {

        if (!$scope.schedule || $scope.schedule.toUpperCase() === 'NOSCHEDULE') {
          $scope.schedule = '';
        }

        $scope.updateSchedule = function () {
          $scope.schedule = _.join($scope.crons.map(function (cron) {
            return cron.cron;
          }), '; ');
        };

        $scope.$on('cron-updated', function () {
          $scope.updateSchedule();
        });

        $scope.add = function () {
          $scope.crons.push({ cron: 'Start: 0 0 * * 1,2,3,4,5' });
          $scope.updateSchedule();
        };

        $scope.remove = function (item) {
          var itemIndex = $scope.crons.indexOf(item);
          $scope.crons.splice(itemIndex, 1);
          $scope.updateSchedule();
        };

        $scope.useSpecificClicked = function () {
          if (!$scope.schedule || $scope.schedule.indexOf(':') === -1) {
            $scope.schedule = 'Start: 0 8 * * 1,2,3,4,5; Stop: 0 19 * * 1,2,3,4,5';
          }
        };

        var loadSchedule = function () {
          $scope.crons = [];
          if ($scope.schedule && $scope.schedule.indexOf(':') !== -1) {
            $scope.crons = $scope.schedule.split(';').map(function (cron) {
              return { cron: cron.trim() };
            });
          }
        };

        $scope.$watch('schedule', function () {
          loadSchedule();
        });

        loadSchedule();

      },
    };
  });
