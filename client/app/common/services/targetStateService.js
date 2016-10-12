/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('targetStateService', function($rootScope, $q, $http) {

 return {
   changeDeploymentStatus: function(enable, service, role, environment) {
     var action = enable ? 'enable' : 'disable';
     var url = '/api/services/'+ action + '/' + service.Name;
     var data = {
       slice: service.Slice,
       environment: environment,
       serverRole: role
     };

     return $http.post(url, data)
      .then(function(result) {
         return result.data;
       },
        $rootScope.$broadcast.bind($rootScope, 'error')
      );
   }
 };
});
