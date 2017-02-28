/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.compare').factory('upstreamService',
  function ($http) {

    var baseUrl = '/api/v1/'
    
    function get() {
      return $http.get(baseUrl + 'config/upstreams/');
    }

    function getSlice(name, environment) {
      return $http.get(baseUrl + 'upstreams/' + name + '/slices/', { params: { environment: environment } });
    }

    return {
      get: get, 
      getSlice: getSlice
    }
  }
);

