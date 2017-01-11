/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common')
  .factory('serviceDiscovery', function ($rootScope, $q, $http) {
    function defaultFailure(error) {
      $rootScope.$broadcast('error', error);
    }

    return {
      getASGState: function (environmentName, asgName) {
        var path = ['api', 'v1', 'environments', environmentName, 'servers', asgName];
        return $http.get(path.join('/')).then(function (response) {
          return response.data;
        }, defaultFailure);
      }
    };
  });
