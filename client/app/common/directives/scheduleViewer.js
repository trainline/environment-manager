/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common')
  .component('scheduleViewer', {
    restrict: 'E',
    bindings: {
      schedule: '=',
      showOnlyCronSchedules: '='
    },
    templateUrl: '/app/common/directives/scheduleViewer.html',
    controllerAs: 'vm',
    controller: function ($scope) {
      var vm = this;

      function update(schedule) {
        if (!schedule) {
          vm.simpleOption = 'Environment Default';
          delete vm.crons;
        } else if (schedule.indexOf(':') === -1) {
          if (schedule === '247') {
            vm.simpleOption = 'Always On';
          } else if (schedule === 'OFF') {
            vm.simpleOption = 'Off';
          } else {
            vm.simpleOption = schedule;
          }

          delete vm.crons;
        } else {
          vm.crons = vm.schedule.split(';').map(function (cronString) {
            if (cronString) {
              var parts = cronString.split(':');
              var action = parts[0].trim() + 's ';
              var englishCron = prettyCron.toString(parts[1].trim());
              return { cron: action + englishCron };
            }
          });
        }
      }

      $scope.$watch('vm.schedule', update);
      update();
    }
  });

