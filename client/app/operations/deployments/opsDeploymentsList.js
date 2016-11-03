/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').component('opsDeploymentsList', {
  templateUrl: '/app/operations/deployments/opsDeploymentsList.html',
  bindings: {
    dataLoading: '<loading',
    dataFound: '<found',
    deployments: '<'
  },
  controllerAs: 'vm',
  controller: function () {
    var vm = this;
  }
});
