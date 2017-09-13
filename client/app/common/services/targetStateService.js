/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').factory('targetStateService', function ($rootScope, $q, $http) {
  return {
    toggleServiceStatus: function (environment, service, slice, enable, serverRole, environmentType) {
      var url = '/api/v1/target-state/' + environment + '/' + service + '/toggle-status';

      var data = {
        Enable: enable,
        Slice: slice,
        ServerRole: serverRole,
        EnvironmentType: environmentType
      };

      return $http.put(url, data)
        .then(function (result) {
          return result.data;
        }, $rootScope.$broadcast.bind($rootScope, 'error'));
    }
  };
});
