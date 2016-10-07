/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .factory('serviceDiscovery', function($rootScope, $q, $http) {

    function defaultFailure(error) {
      $rootScope.$broadcast('error', error);
    }

    return {
      getASGState: function (accountName, environmentName, asgName) {
        var path = ['api', 'environments', environmentName, 'servers', asgName];
        return $http.get(path.join('/')).then(function (response) {
          return response.data;
        }, defaultFailure);
      }
    };

  });
