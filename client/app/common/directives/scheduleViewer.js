/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common')
  .component('scheduleViewer', {
    restrict: 'E',
    bindings: {
      schedule: '=',
      showOnlyCronSchedules: '=',
      simpleView: '='
    },
    templateUrl: '/app/common/directives/scheduleViewer.html',
    controllerAs: 'vm',
    controller: function ($scope) {
      var vm = this;

      function update(schedule) {
        vm.detailedView = !vm.simpleView;
        if (!schedule) {
          vm.simpleOption = 'Environment Default';
          delete vm.crons;
        } else if (schedule.indexOf(':') === -1) {
          if (schedule === '247' || schedule === 'ON') {
            vm.simpleOption = 'Always On';
          } else if (schedule === 'OFF') {
            vm.simpleOption = 'Off';
          } else {
            vm.simpleOption = schedule;
          }

          delete vm.crons;
        } else {
          var schedule = parseScheduleTag(vm.schedule);

          vm.timezone = schedule.timezone.readable;
          vm.crons = schedule.schedules.map(function (s) { return { cron: s.readable }; });

          var next = _.minBy(schedule.schedules, function (s) { return s.next.format('YYYY-MM-DDTHH:mm:ss'); });
          vm.next = next.action + ': ' + next.next.format('ddd HH:mm') + ' (' + moment(next.next).tz('UTC').format('ddd HH:mm z') + ')';
        }
      }

      function parseScheduleTag(scheduleTag) {
        var parts = scheduleTag.split('|');
        var cronsPart = parts[0];
        var timezonePart = parts[1];

        var timezoneCode = timezonePart ? timezonePart.trim() : 'UTC';

        var currentLocalTime = moment.tz(moment.utc(), timezoneCode);
        var timezone = timezoneCode + ' - Currently ' + currentLocalTime.format('HH:mm z');

        var serialisedCrons = cronsPart.split(';');
        var schedules = serialisedCrons.map(function (item) {
          var parts = item.split(':');

          var action = _.capitalize(parts[0].trim());
          var cron = parts[1].trim();

          var englishSchedule = prettyCron.toString(cron);
          var readable = action + ': ' + englishSchedule.replace('Mon, Tue, Wed, Thu and Fri', 'Weekdays');

          var schedule = later.parse.cron(cron);
          var nextOccurrence = later.schedule(schedule).next(1, currentLocalTime.format('YYYY-MM-DDTHH:mm:ss'));
          var next = moment.tz(moment(nextOccurrence).format('YYYY-MM-DDTHH:mm:ss'), timezoneCode);

          return {
            action: action,
            cron: cron,
            readable: readable,
            next: next
          };
        });

        return {
          schedules: schedules,
          timezone: { code: timezoneCode, readable: timezone },
          currentLocalTime: currentLocalTime
        };
      }

      $scope.$watch('vm.schedule', update);
      update();
    }
  });

