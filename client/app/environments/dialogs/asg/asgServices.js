/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').component('asgServices', {
  templateUrl: '/app/environments/dialogs/asg/asgServices.html',
  bindings: {
    asg: '<',
    asgState: '<',
    environment: '<',
    role: '<',
    refresh: '&',
    closeModal: '&'
  },
  controllerAs: 'vm',
  controller: function (roles, $q, $uibModal, modal, Deployment, targetStateService) {
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
          controller: 'DeploymentDetailsModalController as vm',
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

    function checkIfAllServicesDisabled() {
      if (_.every(vm.servicesList, { Action: 'Ignore' })) {
        modal.confirmation({
          title: 'Delete Auto Scaling Group?',
          message: 'There are no longer any active services for this ASG. Would you like ' +
            'to delete the ASG and it\'s associated Launch Configuration?',
          severity: 'Warning',
        }).then(function () {
          vm.asg.delete().then(function () {
            vm.closeModal();
          });
        });
      }
    }

    vm.setDeploymentStatus = function (service) {
      var enableService = service.installationEnabled;
      var promise = $q.when();
      if (enableService === false) {
        promise = modal.confirmation({
          title: 'Disable service deployment?',
          message: 'This will prevent service <strong>' + service.Name + (service.Slice === 'none' ? '' : service.Slice) +
            ' version ' + service.Version + '</strong> from ' +
            'being deployed to new instances from now on. It will NOT affect any existing machines.' +
            'You can use this option to effectively uninstall this service by scaling the ASG to create a new set of servers.<br/>' +
            'Are you sure you want to continue?',
          severity: 'Warning',
        });
      }
      promise.then(function () {
        targetStateService.changeDeploymentAction(service.DeploymentId, enableService).then(function (result) {
          service.Action = result.Action;
          checkIfAllServicesDisabled();
          vm.refresh();
        });
      }, function () {
        service.installationEnabled = true;
      });
    };
  }
});
