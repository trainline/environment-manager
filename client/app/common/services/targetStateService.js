/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('targetStateService', function($rootScope, $q, $http) {

 return {
   changeDeploymentAction: function(deploymentId, enable) {
     var action = enable ? 'Install' : 'Ignore';
     var url = '/api/v1/deployments/' + deploymentId;
     var data = {
       Action: action
     };

     return $http.patch(url, data)
      .then(function (result) {
         return result.data;
       }, $rootScope.$broadcast.bind($rootScope, 'error'));
   }
 };
});
