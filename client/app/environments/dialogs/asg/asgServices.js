/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').component('asgServices', {
  templateUrl: '/app/environments/dialogs/asg/asgServices.html',
  bindings: {
    asg: '<',
    asgState: '<',
    environment: '<',
    role: '<'
  },
  controllerAs: 'vm',
  controller: function (roles, $uibModal, modal, Deployment, targetStateService) {
    var vm = this;
    vm.servicesList = vm.asgState.Services;
    vm.allowServiceDisabling = window.FEATURE_DISABLE_SERVICE;

    vm.servicesList = vm.servicesList.map(function (service) {
      service.installationEnabled = service.Action !== 'Ignore';
      return service;
    });

    vm.showDeploymentLog = function (service) {
      Deployment.getById(vm.asg.$accountName, service.DeploymentId).then(function (deployment) {
        $uibModal.open({
          templateUrl: '/app/operations/deployments/ops-deployment-details-modal.html',
          windowClass: 'deployment-summary',
          controller: 'DeploymentDetailsModalController',
          size: 'lg',
          resolve: {
            deployment: function () {
              return deployment;
            },
          },
        });
      });
    };

    vm.showAsgSingleService = function (service) {
      $uibModal.open({
        component: 'asgSingleService',
        size: 'lg',
        resolve: {
          asg: function () {
            return vm.asg;
          },
          asgState: function() {
            return vm.asgState;
          },
          service: function () {
            return service;
          },
        },
      });
    };

    vm.setDeploymentStatus = function (service) {
      var enableService = service.installationEnabled;
      targetStateService.changeDeploymentAction(service.DeploymentId, enableService).then(function(result) {
        service.Action = result.Action;
      });
    };
  }
});
