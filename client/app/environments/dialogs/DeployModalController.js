/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').controller('DeployModalController',
  function ($scope, $uibModal, $uibModalInstance, $q, modal, awsService, accountMappingService, resources, cachedResources, parameters) {

    $scope.Environment = parameters.Environment;
    $scope.AccountName = '';
    $scope.ServicesList = [];
    $scope.SelectedServiceDeployInfo = '';
    $scope.SelectedServiceActiveSlice = 'N/A';
    $scope.DeploymentMethodsList = [];

    $scope.DeploymentSettings = {
      Environment: parameters.Environment.EnvironmentName,
      SelectedService: '',
      Mode: '',
      Version: '',
      PackagePath: '',
      Slice: 'blue',
    };

    function init() {
      resources.deployment.methods.all().then(function (deploymentMethods) {
        $scope.DeploymentMethodsList = deploymentMethods;
        $scope.DeploymentSettings.Mode = deploymentMethods[0].Value;
      });

      cachedResources.config.deploymentMaps.all().then(function (deploymentMaps) {
        var deployMapName = $scope.Environment.Value.DeploymentMap;
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

            $scope.ServicesList = services.sort();
          }
        }

        // TODO: error handling. If dep map not found, or no services, display error message on dialog instead and disable form
      });

      accountMappingService.GetAccountForEnvironment(parameters.Environment.EnvironmentName).then(function (accountName) {
        $scope.AccountName = accountName;
      });
    }

    $scope.$watch('DeploymentSettings.SelectedService', function (newVal, oldVal) {
      if (newVal) {

        var env = $scope.DeploymentSettings.Environment;

        $scope.SelectedServiceActiveSliceMessage = 'Loading...';
        $scope.SelectedServiceActiveSlices = [];
        resources.environment(env).inAWSAccount($scope.AccountName).getSliceInfoForService(newVal).then(function (result) {
            var slices = result.data;
            if (slices && slices.length > 0) {
              $scope.SelectedServiceActiveSliceMessage = null;
              $scope.SelectedServiceActiveSlices = slices.map(function(slice){
                return 'Upstream: ' + slice.UpstreamName + ' Slice: ' + slice.Name + ' (' + slice.State + ')';
              });
            }
        }).catch(function(err){
            $scope.SelectedServiceActiveSliceMessage = (err.status === 404) ? 'None' : 'Unknown';
        });

        $scope.SelectedServiceDeployInfoMessage = 'Loading...';
        $scope.SelectedServiceDeployInfo = [];
        resources.environment(env).inAWSAccount($scope.AccountName).getDeployedNodesInfoForService(newVal).then(function (result) {
            var nodes = result.data;
            if (nodes && nodes.length > 0) {
              $scope.SelectedServiceDeployInfoMessage = '';
              var nodeDescriptions = nodes.map(function(node){
                var slice = 'v' + node.ServiceTags.version;
                if (node.ServiceTags.slice && node.ServiceTags.slice != 'none') {
                  slice += ' (' + node.ServiceTags.slice + ')';
                }
                return slice;
              });
              $scope.SelectedServiceDeployInfo = _.uniqWith(nodeDescriptions, _.isEqual);
            } else {
              $scope.SelectedServiceDeployInfoMessage = 'Not deployed';
            }
        }).catch(function(err){
            $scope.SelectedServiceDeployInfoMessage = 'Unknown';
        });

      }
    });

    $scope.Ok = function () {

      var service = $scope.DeploymentSettings.SelectedService;
      var version = $scope.DeploymentSettings.Version;
      var env = $scope.DeploymentSettings.Environment;

      // TODO: Call Deploy API in dry-run mode to perform basic validation first

      var modalParameters = {
        title: 'Deploy Service',
        message: 'Are you sure you want to deploy ' + service + ' version ' + version + ' to ' + env + '?',
        action: 'Deploy',
        severity: 'Warning',
      };
      modal.confirmation(modalParameters).then(function () {
        var params = {
          Service: service,
          Version: version,
          Mode: $scope.DeploymentSettings.Mode,
          Slice: $scope.DeploymentSettings.Slice,
          PackagePath: $scope.DeploymentSettings.PackagePath,
        };
        resources.environment(env).inAWSAccount($scope.AccountName).deploy(params).then(function (response) {
          $uibModal.open({
            templateUrl: '/app/operations/deployments/ops-deployment-details-modal.html',
            windowClass: 'deployment-summary',
            controller: 'DeploymentDetailsModalController',
            size: 'lg',
            resolve: {
              deployment: function () {
                return {
                  DeploymentID: response.data.id,
                  Value: {
                    DeploymentType: "",
                    EnvironmentName: response.data.environmentName,
                    EnvironmentType: response.data.environmentTypeName,
                    ExecutionLog: "Deployment starting...",
                    OwningCluster: response.data.clusterName,
                    ServiceName: response.data.serviceName,
                    ServiceSlice: response.data.serviceSlice,
                    ServiceVersion: response.data.serviceVersion,
                    StartTimestamp: moment.utc().format(),
                    Status: "In progress",
                    User: response.data.username
                  },
                  AccountName: response.data.accountName
                };
              },
            },
          });
          $uibModalInstance.close();
        });
      });
    };

    $scope.Cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    init();
  });
