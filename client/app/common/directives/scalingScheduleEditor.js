/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .directive('scalingScheduleEditor', function () {
    return {
      restrict: 'E',
      scope: {
        schedule: '=',
        minSize: '=',
        maxSize: '='
      },
      templateUrl: '/app/common/directives/scalingScheduleEditor.html',
      controller: function ($scope) {

        if (!$scope.schedule) {
          $scope.schedule = [];
        }

        $scope.updateSchedule = function () {
          $scope.schedule = $scope.crons.map(function (cron) {
            return cron.cron;
          });
        };

        $scope.$on('cron-updated', function () {
          $scope.updateSchedule();
        });

        $scope.add = function () {
          $scope.crons.push({
            cron: {
              MaxSize: 1,
              MinSize: 1,
              DesiredCapacity: 1,
              Recurrence: '0 0 * * 1'
            }
          });
          $scope.updateSchedule();
        };

        $scope.remove = function (item) {
          var itemIndex = $scope.crons.indexOf(item);
          $scope.crons.splice(itemIndex, 1);
          $scope.updateSchedule();
        };

        var loadSchedule = function () {
          $scope.crons = [];
          if ($scope.schedule && $scope.schedule.length) {
            $scope.crons = $scope.schedule.map(function (cron) {
              return { cron: cron };
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
