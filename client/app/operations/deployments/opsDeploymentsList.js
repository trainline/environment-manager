/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.operations').component('opsDeploymentsList', {
  templateUrl: '/app/operations/deployments/opsDeploymentsList.html',
  bindings: {
    query: '<',
    showDetails: '&',
    foundServicesFilter: '&',
  },
  controllerAs: 'vm',
  controller: function ($scope, Deployment) {
    var vm = this;
    var triggeredRefresh = false;

    function refresh() {
      vm.dataLoading = true;

      Deployment.getAll(vm.query).then(function (data) {
        vm.deployments = data.map(Deployment.convertToListView);
        vm.uniqueServices = _.uniq(data.map(function (d) { return d.Value.ServiceName; }));
        vm.dataLoading = false;
        vm.dataFound = true;
        
        vm.summary = vm.deployments.reduce(function(summary, d) {
          summary[d.status]++;
          return summary;
        },
        { 'Success':0, 'In Progress':0, 'Cancelled':0, 'Failed':0 });
      });
    }

    $scope.$watch('vm.query', function () {
      if (vm.query !== undefined) {
        refresh();
      }
    });
  }
});

