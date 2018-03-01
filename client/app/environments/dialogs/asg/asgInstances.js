/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments').component('asgInstances', {
  templateUrl: '/app/environments/dialogs/asg/asgInstances.html',
  bindings: {
    asg: '<',
    asgState: '<'
  },
  controllerAs: 'vm',
  controller: function ($uibModal, $http) {
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
      //TODO: What to we want to do in the UI with this operation?
      $http.delete('/api/v1/instances/' + instanceId + '?account=' + accountName)
        .then(function (response) {
          alert(JSON.stringify(response));
        });
    };
  }
});
