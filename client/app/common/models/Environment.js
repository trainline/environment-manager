/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').factory('Environment',
  function ($q, awsService, resources, $http) {
    function Environment(data) {
      _.assign(this, data);
    }

    Environment.all = function (params) {
      var gotParams = _.isObject(params);
      var query = gotParams ? params.query : undefined;
      var useCache = !gotParams || (params.useCache !== false);
      return $http.get('/api/v1/config/environments', { params: query, cache: useCache }).then(function (response) {
        return response.data;
      });
    };

    Environment.getAllOps = function () {
      return $http.get('/api/v1/environments').then(function (response) {
        return response.data;
      });
    };

    Environment.getSchedule = function (environmentName) {
      return $http.get('/api/v1/environments/' + environmentName + '/schedule').then(function (response) {
        return response.data;
      });
    };

    Environment.putSchedule = function (environmentName, version, value) {
      return $http({
        method: 'put',
        url: '/api/v1/environments/' + environmentName + '/schedule',
        data: value,
        headers: { 'expected-version': version }
      });
    };

    _.assign(Environment.prototype, {

    });

    return Environment;
  });
