/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common')
  .directive('cronEditor', function () {
    return {
      restrict: 'E',
      scope: { cron: '=' },
      templateUrl: '/app/common/directives/cronEditor.html',
      controller: function ($scope, $rootScope, $attrs) {
        var parseDays = function (daysStr) {
          if (!daysStr) {
            return [1, 2, 3, 4, 5];
          }

          if (daysStr == '*') {
            return _.range(0, 7);
          } else if (daysStr.indexOf('-') >= 0 && daysStr.length == 3) {
            return _.range(parseInt(daysStr[0]), parseInt(daysStr[2]));
          } else {
            var days = daysStr.split(',').map(function (val) {
              return parseInt(val);
            });

            return days && days.length > 0 ? days : [1, 2, 3, 4, 5];
          }
        };

        var replaceIfNull = function (val, alt) {
          return val && val != '*' ? val : alt;
        };

        var parseCron = function (cron) {
          var parts = cron.trim().split(' ');

          return {
            action: replaceIfNull(parts[0], 'start:').toLowerCase(),
            minute: parseInt(replaceIfNull(parts[1], '0')).toString(),
            hour: parseInt(replaceIfNull(parts[2], '0')).toString(),
            days: parseDays(parts[5])
          };
        };

        var addOrRemove = function (array, value) {
          var index = array.indexOf(value);

          if (index === -1) {
            array.push(value);
          } else if (array.length > 1) {
            array.splice(index, 1);
          }
        };

        var getCronForDays = function (days) {
          if (days.length == 7) {
            return '*';
          } else {
            return _.join(_.sortBy(days), ',');
          }
        };

        var getNumberOptions = function (start, end, step) {
          return _.range(start, end, step).map(function (num) {
            return { value: num, label: _.padStart(num, 2, 0) };
          });
        };

        $scope.options = {
          actions: [
            { value: 'start:', label: 'Start' },
            { value: 'stop:', label: 'Stop' }
          ],
          days: [
            { value: 1, label: 'Mon' },
            { value: 2, label: 'Tue' },
            { value: 3, label: 'Wed' },
            { value: 4, label: 'Thu' },
            { value: 5, label: 'Fri' },
            { value: 6, label: 'Sat' },
            { value: 0, label: 'Sun' }
          ],
          hours: getNumberOptions(0, 24),
          minutes: getNumberOptions(0, 60, 1)
        };

        $scope.isDaySelected = function (dayOption) {
          return _.includes($scope.selections.days, dayOption.value);
        };

        $scope.selectDay = function (dayOption) {
          addOrRemove($scope.selections.days, dayOption.value);
          $scope.updateCron();
        };

        $scope.selectAction = function (val) {
          $scope.selections.action = val;
          $scope.updateCron();
        };

        $scope.updateCron = function () {
          var days = getCronForDays($scope.selections.days);
          $scope.cron.cron = _.join([$scope.selections.action, $scope.selections.minute, $scope.selections.hour, '*', '*', days], ' ').trim();
          $scope.$emit('cron-updated');
        };

        var loadCron = function () {
          $scope.selections = parseCron($scope.cron.cron);
        };

        $scope.$watch('cron', function () {
          loadCron();
        });

        loadCron();
      }
    };
  });
