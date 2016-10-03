/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('cachedResources',
  function ($q, resources) {

    var CachedData = [];

    var cachedResources = {
      config: {
        environments: CachedResource('environments', 'config'),
        environmentTypes: CachedResource('environmentTypes', 'config'),
        deploymentMaps: CachedResource('deploymentMaps', 'config'),
        services: CachedResource('services', 'config'),
        lbSettings: CachedResource('lbSettings', 'config', true),
        lbUpstream: CachedResource('lbUpstream', 'config', true),
        clusters: CachedResource('clusters', 'config'),
        accounts: CachedResource('accounts', 'config'),
      },
      aws: {
        accounts: CachedResource('accounts', 'aws'),
        images: CachedResource('images', 'aws', true),
      },
    };

    function CachedResource(resourceName, section, crossAccount) {
      return {
        all: function () {
          return GetFromCache(resourceName, resources[section][resourceName], crossAccount); },

        flush: function () {
          return FlushCache(resourceName); },

        getByName: function (nameValue, nameAttrib, data) {
          return GetByName(nameValue, nameAttrib, data); },
      };
    }

    function GetFromCache(dataType, resourceFunction, crossAccount) {
      var deferred = $q.defer();
      if (CachedData[dataType]) {
        deferred.resolve(CachedData[dataType]);
      } else {
        var params = {};
        if (crossAccount) {
          params.account = 'all';
        }

        resourceFunction.all(params).then(function (data) {
          console.log('Cache: new data retrieved for ' + dataType);
          CachedData[dataType] = data;
          deferred.resolve(data);
        });
      }

      return deferred.promise;
    }

    function FlushCache(dataType) {
      console.log('Cache: flushing ' + dataType + ' data');
      delete CachedData[dataType];
    }

    function GetByName(nameValue, nameAttrib, data) {
      var matchingEntity = null;
      if (data) {
        data.forEach(function (entity) {
          var entityName = GetEntityName(entity, nameAttrib);
          if (entityName == nameValue) {
            matchingEntity = entity;
            return;
          }
        });
      }

      return matchingEntity;
    }

    function GetEntityName(entity, nameAttrib) {
      var path = nameAttrib.split('.');
      var obj = entity;
      for (var i = 0; i < path.length; i++) {
        obj = obj[path[i]];
      }

      return obj;
    }

    return cachedResources;
  });
