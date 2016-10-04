/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('DeploymentMap',
  function ($http) {
    var baseUrl = '/api/v1/config/deployment-maps';

    function DeploymentMap(data) {
      _.assign(this, data);
    }

    DeploymentMap.getByName = function (name) {
      return $http.get(baseUrl + '/' + name).then(function (response) {
        return new DeploymentMap(response.data);
      });
    };

    DeploymentMap.createWithDefaults = function (environmentName) {
      var data = {
        DeploymentMapName: '',
        Value: {
          SchemaVersion: 1,
          DeploymentTarget: [],
        },
      };
      return new DeploymentMap(data);
    }

    _.assign(DeploymentMap.prototype, {
      update: function (key) {
        return $http({
          method: 'put',
          url: baseUrl + '/' + encodeURIComponent(key),
          data: this.Value,
          headers: { 'expected-version': this.Version }
        });
      },

      save: function () {
        return $http({
          method: 'post',
          url: baseUrl,
          data: _.pick(this, 'Value', 'DeploymentMapName'),
          headers: { 'expected-version': this.Version }
        });
      }
    });

    return DeploymentMap;
  });