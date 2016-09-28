/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .factory('roles', function($http) {

    return {
      get: function(accountName, environmentName) {
        var url = '/api/' + accountName + '/environments/' + environmentName + '/roles/';
        return $http.get(url).then(function(response) {
          return response.data;
        });
      }
    };

  });
