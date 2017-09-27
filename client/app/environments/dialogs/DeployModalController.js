/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments').controller('DeployModalController',
  function ($scope, $http, $uibModal, $uibModalInstance, $q, Deployment, modal, awsService, accountMappingService, resources, cachedResources, parameters) {
    var vm = this;

    vm.environment = parameters.Environment;
    vm.accountName = '';
    vm.servicesList = [];
    vm.selectedServiceDeployInfo = '';
    vm.selectedServiceActiveSlice = 'N/A';
    vm.deploymentMethodsList = [];
    vm.dryRunEnabled = false;
    vm.isBusy = false;

    vm.deploymentSettings = {
      Environment: parameters.Environment.EnvironmentName,
      SelectedService: '',
      Mode: '',
      Version: '',
      PackagePath: '',
      Slice: 'blue'
    };

    function init() {
      resources.deployment.methods.all().then(function (deploymentMethods) {
        vm.deploymentMethodsList = deploymentMethods;
        vm.deploymentSettings.Mode = deploymentMethods[0].Value;
      });

      var waitForConfig = Promise.all([
        cachedResources.config.deploymentMaps.all(),
        cachedResources.config.services.all()
      ]);

      waitForConfig.then(function (config) {
        var deploymentMaps = config[0];
        var allServices = config[1];
        var deployMapName = vm.environment.Value.DeploymentMap;
        if (deployMapName) {
          var deployMap = cachedResources.config.deploymentMaps.getByName(deployMapName, 'DeploymentMapName', deploymentMaps);
          if (deployMap) {
            var services = [];
            deployMap.Value.DeploymentTarget.forEach(function (target) {
              target.Services.forEach(function (service) {
                var serviceConfig = _.find(allServices, { ServiceName: service.ServiceName });
                var obj = _.find(services, { ServiceName: service.ServiceName });
                if (obj !== undefined) {
                  obj.ServerRoleNames.push(target.ServerRoleName);
                } else if (serviceConfig !== undefined) {
                  services.push({
                    ServiceName: service.ServiceName,
                    ServerRoleNames: [target.ServerRoleName]
                  });
                }
              });
            });
            vm.servicesList = _.sortBy(services, 'ServiceName');
          }
        }

        // TODO: error handling. If dep map not found, or no services, display error message on dialog instead and disable form
      });

      accountMappingService.getAccountForEnvironment(parameters.Environment.EnvironmentName).then(function (accountName) {
        vm.accountName = accountName;
      });
    }

    $scope.$watch('vm.deploymentSettings.SelectedService', function (newVal, oldVal) {
      if (newVal) {
        var env = vm.deploymentSettings.Environment;

        vm.selectedServiceActiveSliceMessage = 'Loading...';
        vm.selectedServiceActiveSlices = [];
        $http.get('/api/v1/services/' + newVal + '/slices', { params: { environment: env } }).then(function (response) {
          var slices = response.data;
          if (slices && slices.length > 0) {
            vm.selectedServiceActiveSliceMessage = null;
            vm.selectedServiceActiveSlices = slices.map(function(slice){
              return slice.UpstreamName + ': ' + slice.Name + ' (' + slice.State + ')';
            });
          }
        }).catch(function (err) {
          vm.selectedServiceActiveSliceMessage = (err.status === 404) ? 'None' : 'Unknown';
        });

        vm.selectedServiceDeployInfoMessage = 'Unknown';
        vm.selectedServiceDeployInfo = [];


        var obj = _.find(vm.servicesList, { ServiceName: vm.deploymentSettings.SelectedService });
        vm.serverRoleNames = obj.ServerRoleNames;
        if (obj.ServerRoleNames.length === 1) {
          vm.deploymentSettings.SelectedServerRoleName = obj.ServerRoleNames[0];
        } else {
          vm.deploymentSettings.SelectedServerRoleName = undefined;
        }
      }
    });

    function submitDeployment() {
      vm.isBusy = true;

      var config = {
        url: '/api/v1/deployments',
        method: 'post',
        data: {
          environment: vm.deploymentSettings.Environment,
          version: vm.deploymentSettings.Version,
          service: vm.deploymentSettings.SelectedService,
          server_role: vm.deploymentSettings.SelectedServerRoleName,
          mode: vm.deploymentSettings.Mode,
          slice: vm.deploymentSettings.Mode === 'bg' ? vm.deploymentSettings.Slice : undefined
        }
      };

      if (vm.deploymentSettings.PackagePath) {
        config.data.packageLocation = vm.deploymentSettings.PackagePath;
      }

      if (vm.dryRunEnabled === true) {
        config.params = { dry_run:true };
      }

      $http(config).then(function (response) {
        vm.isBusy = false;
        var data = response.data;

        if (data.isDryRun) {
          $uibModal.open({
            templateUrl: '/app/environments/dialogs/deployment-dry-run-result.html'
          });
        } else {
          $uibModal.open({
            templateUrl: '/app/operations/deployments/ops-deployment-details-modal.html',
            windowClass: 'deployment-summary',
            controller: 'DeploymentDetailsModalController as vm',
            size: 'lg',
            resolve: {
              deployment: function () {
                return Deployment.getById(data.accountName, data.id);
              }
            }
          });
          $uibModalInstance.close();
        }
      }).catch(function() {
        vm.isBusy = false;
      })
    }

    vm.ok = function () {
      var service = vm.deploymentSettings.SelectedService;
      var version = vm.deploymentSettings.Version;
      var env = vm.deploymentSettings.Environment;

      if (vm.dryRunEnabled) {
        submitDeployment();
      } else {
        var modalParameters = {
          title: 'Deploy Service',
          message: 'Are you sure you want to deploy ' + service + ' version ' + version + ' to ' + env + '?',
          action: 'Deploy',
          severity: 'Warning',
        };
        modal.confirmation(modalParameters).then(submitDeployment);
      }
    };

    vm.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    init();
  });

