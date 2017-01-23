/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').factory('DeploymentMap',
  function ($http, deploymentMapConverter) {
    var baseUrl = '/api/v1/config/deployment-maps';

    function DeploymentMap(data) {
      _.assign(this, data);
    }

    DeploymentMap.getByName = function (name) {
      return $http.get(baseUrl + '/' + name).then(function (response) {
        return new DeploymentMap(response.data);
      });
    };

    DeploymentMap.getAll = function () {
      return $http.get(baseUrl).then(function (response) {
        return response.data;
      });
    };

    DeploymentMap.createWithDefaults = function (environmentName) {
      var data = {
        DeploymentMapName: '',
        Value: {
          SchemaVersion: 1,
          DeploymentTarget: []
        }
      };
      return new DeploymentMap(data);
    };

    DeploymentMap.deleteByName = function (name) {
      return $http.delete(baseUrl + '/' + encodeURIComponent(name));
    };

    _.assign(DeploymentMap.prototype, {
      _getValueWithConvertedServerRoles: function () {
        var value = _.clone(this.Value);

        value.DeploymentTarget = value.DeploymentTarget.map(deploymentMapConverter.toDynamoSchema);
        return value;
      },

      update: function () {
        return $http({
          method: 'put',
          url: baseUrl + '/' + encodeURIComponent(this.DeploymentMapName),
          data: this._getValueWithConvertedServerRoles(),
          headers: { 'expected-version': this.Version }
        });
      },

      save: function () {
        return $http({
          method: 'post',
          url: baseUrl,
          data: {
            DeploymentMapName: this.DeploymentMapName,
            Value: _.clone(this.Value)
          },
          headers: { 'expected-version': this.Version }
        });
      }
    });

    return DeploymentMap;
  });

