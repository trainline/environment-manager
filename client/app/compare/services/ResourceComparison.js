/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.compare').factory('ResourceComparison',
  function () {
    return function (data, primaryEnvironmentName, secondaryEnvironmentNames) {
      var self = this;

      function init() {
        var keys = getKeys();
        self.items = getItems(keys);
      }

      function getKeys() {
        var environments = _.union([primaryEnvironmentName], secondaryEnvironmentNames);
        var dataForEnvironments = data.filter(function (item) {
          return _.includes(environments, item.EnvironmentName);
        });

        var keys = _.uniq(dataForEnvironments.map(function (data) {
          return data.key;
        }));

        return keys.sort();
      }

      function getItems(keys) {
        return keys.map(function (key) {
          var primary = getByKeyAndEnvironment(data, key, primaryEnvironmentName);
          return {
            key: key,
            primary: getPrimaryView(primary),
            comparisons: getComparisons(primary, key, secondaryEnvironmentNames)
          };
        });
      }

      function getPrimaryView(primary) {
        var viewLabel,
          viewClass;

        if (primary) {
          if (typeof (primary.Value) !== 'object') {
            viewLabel = primary.Value;
          } else {
            viewLabel = '{ ... }';
            viewClass = 'btn btn-xs btn-default';
          }
        } else {
          viewLabel = 'None';
        }

        return {
          label: viewLabel,
          class: viewClass,
          data: primary
        };
      }

      function getComparisons(primary, key, environmentNames) {
        var comparisons = {};
        environmentNames.forEach(function (environmentName) {
          var secondary = getByKeyAndEnvironment(data, key, environmentName);
          var difference = diff(primary, secondary);
          comparisons[environmentName] = {
            secondary: secondary,
            difference: difference
          };
        });

        return comparisons;
      }

      function diff(primary, secondary) {
        if (!primary && !secondary) return same('None');
        if (primary && !secondary) return different('None', false);

        if (!primary && secondary) {
          if (typeof (secondary.Value) !== 'object') {
            return different(secondary.Value, false);
          }

          return different('{ ... }', true);
        }

        if (!_.isEqual(primary.Value, secondary.Value)) {
          if (typeof (secondary.Value) !== 'object') {
            return different(secondary.Value, false);
          }

          return different('{ ... }', true);
        }

        return same('Identical');
      }

      function same(description) {
        return {
          same: true,
          description: description,
          showable: false,
          class: 'same'
        };
      }

      function different(description, showable) {
        var result = {
          same: false,
          description: description,
          showable: showable,
          class: 'different'
        };

        if (showable) result.class += ' showable';
        return result;
      }

      function getByKeyAndEnvironment(items, key, environmentName) {
        var results = items.filter(function (item) {
          return item.key == key && item.EnvironmentName == environmentName;
        });

        return results.length > 0 ? results[0] : null;
      }

      init();
    };
  }
);

