/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').factory('cachedResources',
  function ($q, resources) {
    var cachePromise = {};
    var cachedResources = {
      config: {
        environments: cachedResource('environments', 'config'),
        environmentTypes: cachedResource('environmentTypes', 'config'),
        deploymentMaps: cachedResource('deploymentMaps', 'config'),
        services: cachedResource('services', 'config'),
        lbSettings: cachedResource('lbSettings', 'config', true),
        lbUpstream: cachedResource('lbUpstream', 'config', true),
        clusters: cachedResource('clusters', 'config'),
        accounts: cachedResource('accounts', 'config')
      },
      aws: {
        accounts: cachedResource('accounts', 'aws'),
        images: cachedResource('images', 'aws', true)
      }
    };

    function cachedResource(resourceName, section, crossAccount) {
      return {
        all: function () {
          return getFromCache(resourceName, resources[section][resourceName], crossAccount);
        },

        flush: function () {
          return flushCache(resourceName);
        },

        getByName: function (nameValue, nameAttrib, data) {
          return getByName(nameValue, nameAttrib, data);
        }
      };
    }

    function getFromCache(dataType, resourceFunction, crossAccount) {
      if (cachePromise[dataType]) {
        return cachePromise[dataType];
      } else {
        var params = {};
        if (crossAccount) {
          params.account = 'all';
        }

        cachePromise[dataType] = resourceFunction.all(params).then(function (data) {
          console.log('Cache: new data retrieved for ' + dataType);
          return data;
        });
        return cachePromise[dataType];
      }

      return deferred.promise;
    }

    function flushCache(dataType) {
      console.log('Cache: flushing ' + dataType + ' data');
      delete cachePromise[dataType];
    }

    function getByName(nameValue, nameAttrib, data) {
      if (data) {
        return _.find(data, function (entity) {
          return _.get(entity, nameAttrib) === nameValue;
        });
      }
    }

    return cachedResources;
  });
