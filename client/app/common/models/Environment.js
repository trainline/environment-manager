/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('Environment',
  function ($q, awsService, resources, $http) {

    function Environment(data) {
      _.assign(this, data);
    }

    Environment.getAll = function (params) {
      return $http.get('/api/v1/config/environments', { params: params.query }).then(function (response) {
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