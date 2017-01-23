/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.configuration').controller('DeploymentMapsController',
  function ($scope, $routeParams, $location, $uibModal, $q, modal, resources, cachedResources, DeploymentMap) {
    var vm = this;

    vm.data = [];

    function init() {
      vm.dataLoading = true;
      vm.canPost = user.hasPermission({ access: 'POST', resource: '/config/deploymentmaps/*' });
      vm.refresh();
    }

    vm.refresh = function () {
      vm.dataLoading = true;
      var environments = [];
      $q.all([
        DeploymentMap.getAll().then(function (deploymentMaps) {
          vm.data = deploymentMaps.map(function (deploymentMap) {
            deploymentMap.UsedBy = [];
            return deploymentMap;
          });

          vm.canDelete = _.some(deploymentMaps, function (deploymentMap) {
            return user.hasPermission({ access: 'DELETE', resource: '/config/deploymentmaps/' + deploymentMap.DeploymentMapName });
          });
        }),

        cachedResources.config.environments.all().then(function (envData) {
          environments = envData;
        })
      ]).then(function () {
        environments.forEach(function (env) {
          var map = _.find(vm.data, { DeploymentMapName: env.Value.DeploymentMap });
          if (map !== undefined) {
            map.UsedBy.push(env.EnvironmentName);
          }
        });
        vm.dataLoading = false;
      });
    };

    vm.canUser = function (action) {
      if (action == 'post') return vm.canPost;
      if (action == 'delete') return vm.canDelete;
    };

    vm.newItem = function () {
      var instance = $uibModal.open({
        templateUrl: '/app/configuration/deployment-maps/deployment-maps-create-modal.html',
        controller: 'DeploymentMapCreateController as vm'
      });
      instance.result.then(function () {
        vm.refresh();
      });
    };

    vm.delete = function (deploymentMap) {
      var name = deploymentMap.DeploymentMapName;
      modal.confirmation({
        title: 'Deleting a Deployment Map',
        message: 'Are you sure you want to delete the <strong>' + name + '</strong> Deployment Map?',
        action: 'Delete',
        severity: 'Danger'
      }).then(function () {
        DeploymentMap.deleteByName(name).then(function () {
          cachedResources.config.deploymentMaps.flush();
          vm.refresh();
        });
      });
    };

    vm.viewHistory = function (map) {
      $scope.ViewAuditHistory('Deployment Map', map.DeploymentMapName);
    };

    vm.countServices = function (map) {
      return Enumerable.From(map.Value.DeploymentTarget).Sum(function (target) {
        return target.Services.length;
      });
    };

    vm.usedBy = function (map) {
      var maxEnvironmentsToDisplay = 5;
      var displayUsedBy = angular.copy(map.UsedBy).sort();
      if (displayUsedBy.length > maxEnvironmentsToDisplay) {
        displayUsedBy.length = maxEnvironmentsToDisplay;
        displayUsedBy[displayUsedBy.length] = '...';
      }

      if (displayUsedBy.length == 0) {
        displayUsedBy.push('-');
      }

      return displayUsedBy.join(', ');
    };

    init();
  });

