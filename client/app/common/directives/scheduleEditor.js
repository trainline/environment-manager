/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
/* eslint-disable no-undef */

'use strict';

angular.module('EnvironmentManager.common')
  .component('scheduleEditor', {
    restrict: 'E',
    bindings: {
      schedule: '=',
      showOn: '=',
      showOff: '=',
      showDefault: '=',
      showSpecific: '=',
      maxSize: '='
    },
    templateUrl: '/app/common/directives/scheduleEditor.html',
    controllerAs: 'vm',
    controller: function ($scope) {
      var vm = this;
      var savedScalingSchedule = vm.schedule;

      function init() {
        checkDisplayOfChartInfo();
        loadSchedule();
      }

      vm.timezones = moment.tz.names();

      if (!vm.schedule || vm.schedule.toUpperCase() === 'NOSCHEDULE') {
        vm.schedule = '';
      } else if (vm.schedule === '247') {
        vm.schedule = 'ON';
      }

      vm.updateTimeZone = function () {
        vm.updateSchedule();
      };

      vm.updateSchedule = function () {
        if (!vm.crons.length) {
          vm.schedule = 'NOSCHEDULE';
        } else {
          var cronString = _.join(vm.crons.map(function (cron) {
            return cron.cron;
          }), '; ');
          var useTimeZone = vm.timezone && vm.timezone.trim().toLowerCase() !== 'utc';
          vm.schedule = cronString + (useTimeZone ? ' | ' + vm.timezone : '');
        }
        updateChart();
      };

      vm.add = function () {
        vm.crons.push({
          cron: '0: 0 8 * * 1,2,3,4,5'
        });
        vm.updateSchedule();
      };

      vm.remove = function (item) {
        var itemIndex = vm.crons.indexOf(item);
        vm.crons.splice(itemIndex, 1);
        vm.updateSchedule();
      };

      vm.useSpecificClicked = function () {
        vm.schedule = savedScalingSchedule;
        if (!vm.schedule || vm.schedule.indexOf(':') === -1) {
          vm.schedule = vm.maxSize + ': 0 8 * * 1,2,3,4,5; 0: 0 19 * * 1,2,3,4,5 | ' + moment.tz.guess();
        }
      };

      function parseScheduleTag(scheduleTag) {
        var parts = scheduleTag.split('|');
        var serialisedCrons = parts[0].split(';');
        var schedules = serialisedCrons.map(function (item) {
          var subParts = item.split(':');
          var serversOnCount = subParts[0].trim().toLowerCase();
          var action = serversOnCount * 1;
          var cron = subParts[1];

          var occurrences = getWeeklyOccurrences(cron);
          return occurrences.map(function (time) {
            return { time: moment.tz(time, 'UTC'), action: action };
          });
        });
        return _.sortBy(_.flatten(schedules), function (schedule) { return schedule.time.format('YYYY-MM-DDTHH:mm:ss'); });
      }

      function getWeeklyOccurrences(cron) {
        if (!cron) return [];

        var schedule = later.parse.cron(cron);
        var startOfWeek = moment.utc().startOf('week').toDate();
        var endOfWeek = moment.utc().endOf('week').toDate();

        return later.schedule(schedule).next(7, startOfWeek, endOfWeek);
      }

      function interpolateWeeklyActionsAsStates(actions) {
        var lastActionOfTheWeek = _.last(actions);
        if (!lastActionOfTheWeek) return [];

        var results = [];

        results.push([Date.parse(moment.utc().startOf('week').format('YYYY-MM-DDTHH:mm:ss')), lastActionOfTheWeek.action]);

        var previousAction;
        actions.forEach(function (current) {
          var previous = previousAction || lastActionOfTheWeek;

          if (current.action !== previous.action) {
            results.push([Date.parse(moment(current.time).subtract(1, 'second').format('YYYY-MM-DDTHH:mm:ss')), previous.action]);
          }
          results.push([Date.parse(current.time.format('YYYY-MM-DDTHH:mm:ss')), current.action]);

          previousAction = current;
        });

        results.push([Date.parse(moment.utc().endOf('week').format('YYYY-MM-DDTHH:mm:ss')), lastActionOfTheWeek.action]);

        return results;
      }

      function updateChart() {
        if (vm.chartConfig) {
          var weeklyActions = parseScheduleTag(vm.schedule);
          vm.chartConfig.series[0].data = interpolateWeeklyActionsAsStates(weeklyActions);
        }
      }

      function loadSchedule() {
        vm.crons = [];
        vm.timezone = 'UTC';
        if (vm.schedule && vm.schedule.indexOf(':') !== -1) {
          var parts = vm.schedule.split('|');
          vm.crons = parts[0].split(';').map(function (cron) {
            return { cron: cron.trim() };
          });
          if (parts.length === 2) {
            vm.timezone = parts[1].trim();
          }
        }
        updateChart();
      }

      function checkDisplayOfChartInfo() {
        if (vm.schedule && vm.schedule !== 'ON' && vm.schedule !== 'OFF') vm.shouldDisplayChartInfo = true;
        else vm.shouldDisplayChartInfo = false;
      }

      $scope.$on('cron-updated', function () {
        vm.updateSchedule();
      });

      $scope.$watch('vm.schedule', function () {
        checkDisplayOfChartInfo();
        loadSchedule();
      });

      function formatDate(date) {
        return moment(date).format('ddd HH:mm:ss');
      }

      vm.chartConfig = {

        chart: {
          width: 600,
          height: 125
        },

        tooltip: {
          formatter: function () {
            return '<b>Time: </b> ' + formatDate(this.x) + '<br /><b>State:</b> ' + this.y;
          }
        },

        xAxis: {
          type: 'datetime',
          title: null,
          dateTimeLabelFormats: {
            day: '%a'
          },
          offset: 10
        },

        credits: { enabled: false },

        yAxis: {
          min: 0,
          max: vm.maxSize,
          title: null,
          gridLineWidth: 0
        },

        series: [{
          type: 'line',
          data: []
        }],

        navigation: {
          buttonOptions: {
            enabled: false
          }
        },

        title: null,

        legend: {
          enabled: false
        }

      };

      init();
    }
  });
