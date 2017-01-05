/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.configuration').controller('DeploymentMapCreateController',
  function ($uibModalInstance, resources, cachedResources, DeploymentMap) {
    var vm = this;

    vm.deploymentMaps = [];
    vm.deploymentMapNames = [];

    vm.deploymentMap;
    vm.cloneExisting = false;
    vm.deploymentMapNameToClone = '';

    function init() {
      vm.deploymentMap = DeploymentMap.createWithDefaults();

      resources.config.deploymentMaps.all().then(function (deploymentMaps) {
        vm.deploymentMaps = deploymentMaps;
        vm.deploymentMapNames = _.map(deploymentMaps, 'DeploymentMapName').sort();
        vm.deploymentMapNameToClone = vm.deploymentMapNames[0];
      });
    }

    vm.ok = function () {

      if (vm.cloneExisting) {
        var selectedDeploymentMap = _.find(vm.deploymentMaps, { DeploymentMapName: vm.deploymentMapNameToClone});
        if (selectedDeploymentMap !== undefined) {
          vm.deploymentMap.Value.DeploymentTarget = angular.copy(selectedDeploymentMap.Value.DeploymentTarget);
        }
      }

      vm.deploymentMap.save().then(function (data) {
        cachedResources.config.deploymentMaps.flush();
        $uibModalInstance.close(data);
      });
    };

    vm.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    init();
  });
