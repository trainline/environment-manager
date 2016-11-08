/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').component('opsDeploymentsInstances', {
  templateUrl: '/app/operations/deployments/opsDeploymentsInstances.html',
  bindings: {
    dataLoading: '<loading',
    dataFound: '<found',
    deployments: '<'
  },
  controllerAs: 'vm',
  controller: function ($http) {
    var vm = this;

    $http.get('/api/v1/instances/?environment=c50&cluster=Infra&include_services=true').then(function (response) {
      var instances = response.data;
      vm.instances = instances;
      console.log(instances);
    });
  }
});
