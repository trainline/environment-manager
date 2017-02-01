/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.compare').factory('serviceComparison',
  function (comparisons) {
    return function (data, primaryEnvironmentName, secondaryEnvironmentNames) {
      function getKeys() {
        var environments = _.union([primaryEnvironmentName], secondaryEnvironmentNames);
        var dataForEnvironments = data.filter(function (item) {
          return _.includes(environments, item.EnvironmentName);
        });

        var keys = _.uniq(dataForEnvironments.map(function (data) { return data.key; }));

        return keys.sort();
      }

      function getItems(keys) {
        return keys.map(function (key) {
          var primary = getByKeyAndEnvironment(data, key, primaryEnvironmentName);
          return {
            key: key,
            primary: getCellView(primary),
            comparisons: getComparisons(primary, key)
          };
        });
      }

      function getByKeyAndEnvironment(items, key, environmentName) {
        return _.find(items, { key: key, EnvironmentName: environmentName });
      }

      function getCellView(data) {
        if (data !== undefined) {
          data.deployments = data.deployments.sort(function (a, b) {
            return comparisons.semver(a.version, b.version);
          });
        }

        return data;
      }

      function getComparisons(primary, key) {
        var comparisons = {};
        secondaryEnvironmentNames.forEach(function (environmentName) {
          var secondary = getByKeyAndEnvironment(data, key, environmentName);
          comparisons[environmentName] = getCellView(secondary);
        });

        return comparisons;
      }

      var keys = getKeys();
      return {
        items: getItems(keys)
      };
    };
  }
);

