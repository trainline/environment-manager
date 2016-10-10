/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('Environment',
  function ($q, awsService, resources, $http) {

    function Environment(data) {
      _.assign(this, data);
    }

    Environment.all = function (params) {
      var query = params && params.query;
      return $http.get('/api/v1/config/environments', { params: query, cache: true }).then(function (response) {
        return response.data;
      });
    };

    Environment.getAllSchedules = function () {
      return $http.get('/api/v1/environments/schedule-status').then(function (response) {
        return response.data;
      });
    };

    _.assign(Environment.prototype, {

    });

    return Environment;
  });