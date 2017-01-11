/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.configuration').component('copyServerRole', {
  templateUrl: '/app/configuration/deployment-maps/copyServerRole.html',
  bindings: {
    resolve: '<',
    dismiss: '&',
    close: '&'
  },
  controllerAs: 'vm',
  controller: function (resources, cachedResources, modal, deploymentMapConverter) {
    var vm = this;
    var deploymentMaps;
    vm.dataLoading = true;
    vm.selected = {};

    resources.config.deploymentMaps.all().then(function (dmps) {
      deploymentMaps = dmps;

      vm.deploymentMapNames = _.map(deploymentMaps, 'DeploymentMapName').sort();
      _.pull(vm.deploymentMapNames, vm.resolve.srcDeploymentMapName);

      var srcDeploymentMap = _.find(deploymentMaps, { DeploymentMapName: vm.resolve.srcDeploymentMapName });
      vm.serverRole = _.find(srcDeploymentMap.Value.DeploymentTarget, { ServerRoleName: vm.resolve.serverRoleName });

      vm.selected.deploymentMapName = vm.deploymentMapNames[0];
      vm.dataLoading = false;
    });

    vm.canUserCopyTo = function (deploymentMapName) {
      return user.hasPermission({ access: 'PUT', resource: '/config/deploymentmaps/' + deploymentMapName });
    };

    vm.checkAndCopy = function (dstDeploymentMapName) {
      var dstDeploymentMap = _.find(deploymentMaps, { DeploymentMapName: dstDeploymentMapName });
      var dstServerRole = _.find(dstDeploymentMap.Value.DeploymentTarget, { ServerRoleName: vm.serverRole.ServerRoleName });

      if (dstServerRole !== undefined) { // if same name
        modal.confirmation({
          title: 'Overwrite a Server Role',
          message: 'This role already exists in target Deployment Map.<br/>Do you want to overwrite "<strong>' + dstServerRole.ServerRoleName + '</strong>" in "' + dstDeploymentMapName + '"?',
          action: 'Overwrite',
          severity: 'Danger'
        }).then(function () {
          copyTo(dstDeploymentMap, true);
        });
      } else {
        copyTo(dstDeploymentMap);
      }
    };

    function copyTo(deploymentMap, overwriteServerRole) {
      if (overwriteServerRole === true) {
        var index = _.findIndex(deploymentMap.Value.DeploymentTarget, { ServerRoleName: vm.serverRole.ServerRoleName });
        deploymentMap.Value.DeploymentTarget[index] = vm.serverRole;
      } else {
        // Add new record
        deploymentMap.Value.DeploymentTarget.push(vm.serverRole);
      }

      // Convert back to Dynamo format for writing to the DB
      var deploymentMapValue = deploymentMap.Value.DeploymentTarget;

      var params = {
        key: deploymentMap.DeploymentMapName,
        expectedVersion: deploymentMap.Version,
        data: { DeploymentTarget: deploymentMapValue }
      };

      resources.config.deploymentMaps.put(params).then(function () {
        cachedResources.config.deploymentMaps.flush();
        vm.close();
      });
    }
  }
});
