/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

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

        function parseSchedule(crons) {
          var schedules = crons.map(function (item) {
            var cron = item.cron;
            var occurrences = getWeeklyOccurrences(cron.Recurrence);
            return occurrences.map(function (time) {
              return { time: moment.tz(time, 'UTC'), action: cron.DesiredCapacity };
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
          if ($scope.chartConfig) {
            var weeklyActions = parseSchedule($scope.crons);
            $scope.chartConfig.series[0].data = interpolateWeeklyActionsAsStates(weeklyActions);
          }
        }

        var loadSchedule = function () {
          $scope.crons = [];
          if ($scope.schedule && $scope.schedule.length) {
            $scope.crons = $scope.schedule.map(function (cron) {
              return { cron: cron };
            });
          }
          updateChart();
        };

        $scope.$watch('schedule', function () {
          loadSchedule();
        });

        loadSchedule();

        function formatDate(date) {
          return moment(date).format('ddd HH:mm:ss');
        }

        $scope.chartConfig = {

          chart: {
            width: 600,
            height: 250
          },

          tooltip: {
            formatter: function () {
              return '<b>Time: </b> ' + formatDate(this.x) + '<br /><b>Size:</b> ' + this.y;
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
      }
    };
  });
