/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments').component('asgInstances', {
  templateUrl: '/app/environments/dialogs/asg/asgInstances.html',
  bindings: {
    asg: '<',
    asgState: '<'
  },
  controllerAs: 'vm',
  controller: function ($uibModal, $http, $scope, modal) {
    var vm = this;
    vm.dataLoading = false;

    vm.showAsgSingleInstance = function (instance) {
      $uibModal.open({
        component: 'asgSingleInstance',
        size: 'lg',
        resolve: {
          instance: function () {
            return instance;
          }
        }
      });
    };

    vm.terminateInstance = function (instanceId, accountName) {
      var modalParameters = {
        title: 'Terminate instance?',
        message: 'Are you sure you want to terminate <strong>' + instanceId + '</strong>?',
        action: 'Terminate',
        severity: 'Danger',
        acknowledge: 'I am sure I want to terminate this instance: ' + instanceId + '.'
      };

      return modal.confirmation(modalParameters).then(function () {
        return $http.delete('/api/v1/instances/' + instanceId + '?account=' + accountName)
          .then(() => {
            $scope.$emit('InstanceTerminating');
          });
      });
    };

    vm.notReadyForTerminate = function (instance) {
      if (instance.LifecycleState.toLowerCase() !== 'inservice'
        || instance.State.toLowerCase() !== 'running') {
        return true;
      }

      return false;
    };
  }
});
