/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').component('opsDeploymentsList', {
  templateUrl: '/app/operations/deployments/opsDeploymentsList.html',
  bindings: {
    query: '<',
    showDetails: '&'
  },
  controllerAs: 'vm',
  controller: function ($scope, Deployment, $uibModal) {
    var vm = this;

    function refresh() {
      vm.dataLoading = true;
      Deployment.getAll(vm.query).then(function (data) {
        vm.deployments = data.map(Deployment.convertToListView);

        vm.uniqueServices = _.uniq(data.map(function (d) { return d.Value.ServiceName; }));

        vm.dataLoading = false;
        vm.dataFound = true;
      });
    }

    $scope.$on('refresh', refresh);
  }
});
