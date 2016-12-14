/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').component('opsDeploymentsInstances', {
  templateUrl: '/app/operations/deployments/opsDeploymentsInstances.html',
  bindings: {
    query: '<',
    instancesFilter: '&'
  },
  controllerAs: 'vm',
  controller: function ($scope, $http, $uibModal) {
    var vm = this;

    function refresh() {
      if (vm.query === undefined) {
        return;
      }
      vm.dataLoading = true;
      var params = _.clone(vm.query);
      params.include_deployments_status = true;

      $http.get('/api/v1/instances', { params: params }).then(function (response) {
        var instances = response.data;
        vm.instances = instances;
        _.each(instances, function (instance) {
          instance.asgLink = '#/environment/servers/?environment=' + instance.Environment + '&asg_name=' + instance['aws:autoscaling:groupName'];
          instance.status = _.capitalize(instance.State.Name);
        });

        vm.dataLoading = false;
        vm.dataFound = true;
      }, function () {
        vm.dataFound = false;
        vm.dataLoading = false;
      });
    }

    vm.showDetails = function (instance) {
      console.log(instance);
      $uibModal.open({
        component: 'asgSingleInstance',
        size: 'lg',
        resolve: {
          instance: function () {
            return instance;
          },
        },
      });
    };

    $scope.$watch('vm.query', function () {
      refresh();
    });
  }
});
