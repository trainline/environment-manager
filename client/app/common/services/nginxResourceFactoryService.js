/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('nginxResourceFactory',
  function ($q, $http) {

    function NginxResource(params) {
      this.name = params.name;
      this.description = params.description;

      this.all = function (params) {
        var url = ['api', 'nginx', params.instance].join('/');
        return $http.get(url).then(function (response) {
          return response.data;
        });
      };
    };

    return {
      get: function (params) {
        return new NginxResource(params);
      },
    };
  });
