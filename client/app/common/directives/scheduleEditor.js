/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common')
  .component('scheduleEditor', {
    restrict: 'E',
    bindings: {
      schedule: '=',
      showOn: '=',
      showOff: '=',
      showDefault: '=',
      showSpecific: '='
    },
    templateUrl: '/app/common/directives/scheduleEditor.html',
    controllerAs: 'vm',
    controller: function ($scope) {
      var vm = this;

      if (!vm.schedule || vm.schedule.toUpperCase() === 'NOSCHEDULE') {
        vm.schedule = '';
      } else if (vm.schedule === '247') {
        vm.schedule = 'ON';
      }

      vm.updateSchedule = function () {
        vm.schedule = _.join(vm.crons.map(function (cron) {
          return cron.cron;
        }), '; ');
      };

      vm.add = function () {
        vm.crons.push({ cron: 'Start: 0 0 * * 1,2,3,4,5' });
        vm.updateSchedule();
      };

      vm.remove = function (item) {
        var itemIndex = vm.crons.indexOf(item);
        vm.crons.splice(itemIndex, 1);
        vm.updateSchedule();
      };

      vm.useSpecificClicked = function () {
        if (!vm.schedule || vm.schedule.indexOf(':') === -1) {
          vm.schedule = 'Start: 0 8 * * 1,2,3,4,5; Stop: 0 19 * * 1,2,3,4,5';
        }
      };

      function loadSchedule() {
        vm.crons = [];
        if (vm.schedule && vm.schedule.indexOf(':') !== -1) {
          vm.crons = vm.schedule.split(';').map(function (cron) {
            return { cron: cron.trim() };
          });
        }
      }

      $scope.$on('cron-updated', function () {
        vm.updateSchedule();
      });

      $scope.$watch('vm.schedule', function () {
        loadSchedule();
      });

      loadSchedule();
    }
  });
