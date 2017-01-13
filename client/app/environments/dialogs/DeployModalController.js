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

      cachedResources.config.deploymentMaps.all().then(function (deploymentMaps) {
        var deployMapName = vm.environment.Value.DeploymentMap;
        if (deployMapName) {
          var deployMap = cachedResources.config.deploymentMaps.getByName(deployMapName, 'DeploymentMapName', deploymentMaps);
          if (deployMap) {
            var services = [];
            deployMap.Value.DeploymentTarget.forEach(function (target) {
              target.Services.forEach(function (service) {
                services.push(service.ServiceName);
              });
            });
            services = _.uniq(services);

            vm.servicesList = services.sort();
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
            vm.selectedServiceActiveSlices = slices.map(function (slice) {
              return 'Upstream: ' + slice.UpstreamName + ' Slice: ' + slice.Name + ' (' + slice.State + ')';
            });
          }
        }).catch(function (err) {
          vm.selectedServiceActiveSliceMessage = (err.status === 404) ? 'None' : 'Unknown';
        });

        vm.selectedServiceDeployInfoMessage = 'Unknown';
        vm.selectedServiceDeployInfo = [];
      }
    });

    function submitDeployment() {
      var config = {
        url: '/api/v1/deployments',
        method: 'post',
        data: {
          environment: vm.deploymentSettings.Environment,
          version: vm.deploymentSettings.Version,
          service: vm.deploymentSettings.SelectedService,
          mode: vm.deploymentSettings.Mode,
          slice: vm.deploymentSettings.Mode === 'bg' ? vm.deploymentSettings.Slice : undefined,
          packageLocation: vm.deploymentSettings.PackagePath,
        }
      };

      if (vm.dryRunEnabled === true) {
        config.params = { dry_run:true };
      }

      $http(config).then(function (response) {
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
      });
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
