/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .factory('servers', function($rootScope, $http, $httpParamSerializer) {

    function defaultFailure(error) {
      $rootScope.$broadcast('error', error);
    };
    
    return {
      all: function(options) {
        var url = '/api/environments/' + options.environment.EnvironmentName + '/servers';
        var params = {
          account: options.account
        };
        url = url + '?' + $httpParamSerializer(params);
        return $http.get(url).then(function(response) {
          return response.data;
        }, defaultFailure);
      }
    };

  });
