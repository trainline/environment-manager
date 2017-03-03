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
          vm.crons = schedule.schedules.map(s => ({ cron: s.readable }));

          var next = _.minBy(schedule.schedules, s => s.next.format('YYYY-MM-DDTHH:mm:ss'));
          vm.next = next.action + ': ' + next.next.format('ddd HH:mm') + ' (' + moment(next.next).tz('UTC').format('ddd HH:mm z') + ')';
        }
      }

      function parseScheduleTag(scheduleTag) {
        let [cronsPart, timezonePart] = scheduleTag.split('|');
        let timezoneCode = timezonePart ? timezonePart.trim() : 'UTC';

        let currentLocalTime = moment.tz(moment.utc(), timezoneCode);
        let timezone = timezoneCode + ' - Currently ' + currentLocalTime.format('HH:mm z');

        let serialisedCrons = cronsPart.split(';');
        let schedules = serialisedCrons.map((item) => {
          let parts = item.split(':');

          let action = _.capitalize(parts[0].trim());
          let cron = parts[1].trim();

          let englishSchedule = prettyCron.toString(cron);
          let readable = action + ': ' + englishSchedule.replace('Mon, Tue, Wed, Thu and Fri', 'Weekdays');

          let schedule = later.parse.cron(cron);
          let nextOccurrence = later.schedule(schedule).next(1, currentLocalTime.format('YYYY-MM-DDTHH:mm:ss'));
          let next = moment.tz(moment(nextOccurrence).format('YYYY-MM-DDTHH:mm:ss'), timezoneCode);

          return { action, cron, readable, next };
        });

        return {
          schedules,
          timezone: { code: timezoneCode, readable: timezone },
          currentLocalTime
        };
      }

      $scope.$watch('vm.schedule', update);
      update();
    }
  });

