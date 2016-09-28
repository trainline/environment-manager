/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .directive('scheduleViewer', function () {
    return {
      restrict: 'E',
      scope: {
        schedule: '=',
        showOnlyCronSchedules: '=',
      },
      templateUrl: '/app/common/directives/scheduleViewer.html',
      controller: function ($scope) {

        var update = function (schedule) {
          if (!schedule) {
            $scope.simpleOption = 'Environment Default';
            delete $scope.crons;
          } else if (schedule.indexOf(':') === -1) {
            if (schedule === '247') {
              $scope.simpleOption = 'Always On';
            } else if (schedule === 'OFF') {
              $scope.simpleOption = 'Off';
            } else {
              $scope.simpleOption = schedule;
            }

            delete $scope.crons;
          } else {
            $scope.crons = $scope.schedule.split(';').map(function (cronString) {
              if (cronString) {
                var parts = cronString.split(':');
                var action = parts[0].trim() + 's ';
                var englishCron = prettyCron.toString(parts[1].trim());
                return { cron: action + englishCron };
              }
            });
          }
        };

        $scope.$watch('schedule', update);
        update();

      },
    };
  });
