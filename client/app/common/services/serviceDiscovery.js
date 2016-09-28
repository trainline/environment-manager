/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .factory('serviceDiscovery', function($rootScope, $q, $http, $httpParamSerializer) {

    function defaultFailure(error) {
      $rootScope.$broadcast('error', error);
    }

    function get(url, params) {
      url = url + '?' + $httpParamSerializer(params);
      return $http.get(url).then(function(response) {
        return response.data;
      }, defaultFailure);
    }
    
    return {
      getASGState: function (accountName, environmentName, asgName) {
        var path = ['api', 'environments', environmentName, 'servers', asgName];
        return get(path.join('/'), { account: accountName });
      }
    };

  });
