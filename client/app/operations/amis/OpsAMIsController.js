/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').controller('OpsAMIsController',
  function ($scope, $routeParams, $location, $uibModal, $q, resources, cachedResources, accountMappingService, awsService, modal, QuerySync) {

    var SHOW_ALL_OPTION = 'Any';

    $scope.EnvironmentsList = {};
    $scope.OwningClustersList = [];
    $scope.AmiData = [];
    $scope.FullData = [];
    $scope.Data = [];
    $scope.DataLoading = true;

    $scope.SelectedAccount = '';

    var querySync;

    function init() {
      $q.all([
        cachedResources.config.environments.all().then(function (environments) {
          environments.sort(function (source, target) {
            return source.EnvironmentName.localeCompare(target.EnvironmentName);
          }).forEach(function (environment) {
            $scope.EnvironmentsList[environment.EnvironmentName] = environment;
          });

          querySync = new QuerySync($scope, {
            environment: {
              property: 'SelectedEnvironment',
              default: environments[0].EnvironmentName,
            },
            cluster: {
              property: 'SelectedOwningCluster',
              default: SHOW_ALL_OPTION,
            },
            server: {
              property: 'SelectedServerRole',
              default: '',
            },
            ami: {
              property: 'SelectedAmi',
              default: '',
            }
          });

          querySync.init();
        }),

        cachedResources.config.clusters.all().then(function (clusters) {
          $scope.OwningClustersList = [SHOW_ALL_OPTION].concat(_.map(clusters, 'ClusterName')).sort();
        }),

        awsService.images.GetImageDetails().then(function (amiData) {
          $scope.AmiData = amiData;
        }),
      ]).then(function () {
        $scope.Refresh();
      });
    }

    $scope.Refresh = function () {
      $scope.DataLoading = true;

      querySync.updateQuery();

      accountMappingService.getAccountForEnvironment($scope.SelectedEnvironment).then(function (accountName) {
        $scope.SelectedAccount = accountName;

        var params = {
          account: accountName,
          query: {
            'environment': $scope.SelectedEnvironment,
          },
        };

        if ($scope.SelectedOwningCluster != SHOW_ALL_OPTION) {
          params.query['cluster'] = $scope.SelectedOwningCluster;
        }

        awsService.instances.GetInstanceDetails(params).then(function (instanceData) {

          // Merge in AMI details against each instance
          $scope.FullData = awsService.images.MergeExtraImageDataToInstances(instanceData, $scope.AmiData);

        }).finally(function () {
          $scope.UpdateFilter();
          $scope.DataLoading = false;
        });
      });
    };

    $scope.UpdateFilter = function () {

      querySync.updateQuery();

      $scope.Data = $scope.FullData.filter(function (server) {
        var match = true;

        if ($scope.SelectedServerRole) {
          if (!server.Role) {
            match = false;
          } else {
            match = match && angular.lowercase(server.Role).indexOf(angular.lowercase($scope.SelectedServerRole)) != -1;
          }
        }

        // AMI filter (against image ID or AMI name/version)
        if ($scope.SelectedAmi) {
          var amiInfo = server.ImageId;
          if (server.Ami && server.Ami.Name) amiInfo = amiInfo + server.Ami.Name;
          match = match && angular.lowercase(amiInfo).indexOf(angular.lowercase($scope.SelectedAmi)) != -1;
        }

        return match;
      });
    };

    $scope.EditAutoScalingGroup = function (groupName) {
      if (groupName) {
        $uibModal.open({
          templateUrl: '/app/environments/dialogs/env-asg-details-modal.html',
          controller: 'ASGDetailsModalController as vm',
          windowClass: 'InstanceDetails',
          resolve: {
            parameters: function () {
              return {
                groupName: groupName,
                environment: $scope.EnvironmentsList[$scope.SelectedEnvironment],
                accountName: $scope.SelectedAccount,
                defaultAction: 'launchConfig',
              };
            },
          },
        }).result.then(function () {
          $scope.Refresh();
        });
      } else {
        modal.information({
          title: 'Not part of ASG',
          message: 'This operation is not available as this AMI doesn\'t belong to an ASG.',
          severity: 'Info',
        });
      }
    };

    init();
  });
