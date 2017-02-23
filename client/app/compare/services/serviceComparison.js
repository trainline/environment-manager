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
        var items = keys.map(function (key) {
          var primary = getByKeyAndEnvironment(data, key, primaryEnvironmentName);
          return {
            key: key,
            primary: getCellView(primary),
            comparisons: getComparisons(primary, key)
          };
        });

        decorateItemsWithVersionInformation(items);

        return items;
      }

      function decorateItemsWithVersionInformation(items) {
        items.forEach(function (item) {
          addVersionInformationToItem(item);
        });
      }

      function addVersionInformationToItem(item) {
        if (!hasDeployment(item.primary)) return;

        getComparisonsList(item).forEach(function (comparisonKey) {
          createVersionCompareInformation(item, comparisonKey, getLatestDeploymentVersion(item.primary));          
        });

      }

      function createVersionCompareInformation(item, comparisonKey, latestPrimaryDeploymentVersion) {
        if (item.comparisons[comparisonKey] && hasDeployment(item.comparisons[comparisonKey])) {
            var check = comparisons.semver(latestPrimaryDeploymentVersion, getLatestDeploymentVersion(item.comparisons[comparisonKey]));
            if (check === -1) {
              getLatestDeployment(item.comparisons[comparisonKey]).versionCompare = "NEWER";
            } else if (check === 1) {
              getLatestDeployment(item.comparisons[comparisonKey]).versionCompare = "OLDER";
            } else {
              getLatestDeployment(item.comparisons[comparisonKey]).versionCompare = "SAME";
            }
          }
      }

      function getComparisonsList(item) {
        return Object.keys(item.comparisons);
      }

      function hasDeployment(item) {
        return item && item.deployments && Array.isArray(item.deployments);
      }

      function getLatestDeployment(item) {
        return item.deployments[item.deployments.length - 1];
      }

      function getLatestDeploymentVersion(item) {
        return getLatestDeployment(item).version;
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

