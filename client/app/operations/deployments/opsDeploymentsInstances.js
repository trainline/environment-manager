/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').component('opsDeploymentsInstances', {
  templateUrl: '/app/operations/deployments/opsDeploymentsInstances.html',
  bindings: {
  },
  controllerAs: 'vm',
  controller: function ($scope, $http) {
    var vm = this;

    function updateInstanceDeploymentStatus(instance) {
      var allHealthy = _.every(instance.Services, function (service) {
        var status = _.get(service, 'OverallHealth.Status');
        return status === undefined || status === 'Healthy';
      });
      instance.deploymentStatus = allHealthy ? 'Success' : 'Failed';
    }

    vm.refresh = function () {
      vm.dataLoading = true;
      $http.get('/api/v1/instances/?environment=c50&cluster=Infra', {
        params: {
          cluster: 'Infra',
          include_services: true
        }
      }).then(function (response) {
        var instances = response.data;
        vm.instances = instances;
        _.each(instances, function (instance) {
          instance.asgLink = '#/environment/servers/?environment=' + instance.Environment + '&asg_name=' + instance['aws:autoscaling:groupName'];
          instance.status = _.capitalize(instance.State.Name);

          updateInstanceDeploymentStatus(instance);
        });

        vm.dataLoading = false;
        vm.dataFound = true;
      });
    };

    vm.refresh();

    $scope.$on('refresh', function () {
      vm.refresh();
    });

  }
});
