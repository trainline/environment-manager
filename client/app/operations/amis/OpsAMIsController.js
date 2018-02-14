/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.operations').controller('OpsAMIsController',
  function ($scope, $routeParams, $location, $uibModal, $q, resources, cachedResources, accountMappingService, awsService, modal, QuerySync, localstorageservice) {
    var vm = this;
    var SHOW_ALL_OPTION = 'Any';

    vm.environmentsList = {};
    vm.owningClustersList = [];
    vm.amiData = [];
    vm.fullData = [];
    vm.data = [];
    vm.dataLoading = true;

    vm.selectedAccount = '';

    vm.agesList = [1, 7, 30, 60];

    var querySync;

    function init() {
      $q.all([
        cachedResources.config.environments.all().then(function (environments) {
          environments.sort(function (source, target) {
            return source.EnvironmentName.localeCompare(target.EnvironmentName);
          }).forEach(function (environment) {
            vm.environmentsList[environment.EnvironmentName] = environment;
          });

          querySync = new QuerySync(vm, {
            environment: {
              property: 'selectedEnvironment',
              default: environments[0].EnvironmentName
            },
            cluster: {
              property: 'selectedOwningCluster',
              default: localstorageservice.getValueOrDefault('em-selections-team', SHOW_ALL_OPTION)
            },
            server: {
              property: 'selectedServerRole',
              default: ''
            },
            ami: {
              property: 'selectedAmi',
              default: ''
            },
            age: {
              property: 'selectedAge',
              default: '0'
            }
          });

          querySync.init();

          if (vm.selectedAge === true) {
            vm.selectedAge = '0';
            querySync.updateQuery();
          }
        }),

        cachedResources.config.clusters.all().then(function (clusters) {
          vm.owningClustersList = [SHOW_ALL_OPTION].concat(_.map(clusters, 'ClusterName')).sort();
        }),

        awsService.images.GetImageDetails().then(function (amiData) {
          vm.amiData = amiData;
        })
      ]).then(function () {
        vm.refresh();
      });
    }

    vm.refresh = function () {
      vm.dataLoading = true;

      querySync.updateQuery();

      localstorageservice.set('em-selections-team', vm.selectedOwningCluster);

      accountMappingService.getAccountForEnvironment(vm.selectedEnvironment).then(function (accountName) {
        vm.selectedAccount = accountName;

        var params = {
          account: accountName,
          query: {
            environment: vm.selectedEnvironment
          }
        };

        if (vm.selectedOwningCluster != SHOW_ALL_OPTION) {
          params.query.cluster = vm.selectedOwningCluster;
        }

        awsService.instances.GetInstanceDetails(params).then(function (instanceData) {
          // Merge in AMI details against each instance
          vm.fullData = awsService.images.MergeExtraImageDataToInstances(instanceData, vm.amiData);
        }).finally(function () {
          vm.updateFilter();
          vm.dataLoading = false;
        });
      });
    };

    function isOlderThan(days, server) {
      if (server.UsingLatestAmi === true) {
        return false;
      }
      if (server.DaysBehindLatest === undefined) {
        return false;
      } else if (server.DaysBehindLatest < days) {
        return false;
      }
      return true;
    }

    vm.updateFilter = function () {
      querySync.updateQuery();

      vm.countOlderThanDays = _.reduce(vm.agesList, function (result, value, key) {
        result[value] = 0;
        return result;
      }, {});
      vm.countOlderThanDays[0] = 0;

      vm.data = vm.fullData.filter(function (server) {
        if (vm.selectedServerRole) {
          if (!server.Role) {
            return false;
          } else {
            if (angular.lowercase(server.Role).indexOf(angular.lowercase(vm.selectedServerRole)) === -1) {
              return false;
            }
          }
        }

        // AMI filter (against image ID or AMI name/version)
        if (vm.selectedAmi) {
          var amiInfo = server.ImageId;
          if (server.Ami && server.Ami.Name) amiInfo += server.Ami.Name;
          if (angular.lowercase(amiInfo).indexOf(angular.lowercase(vm.selectedAmi)) === -1) {
            return false;
          }
        }

        vm.countOlderThanDays[0] += 1;

        _.each(vm.agesList, function (days) {
           if (isOlderThan(days, server)) {
             vm.countOlderThanDays[days] += 1;
           }
        });

        var selectedAge = Number(vm.selectedAge);
        if (selectedAge !== 0) {
          if (!isOlderThan(selectedAge, server)) {
            return false;
          }
        }

        return true;
      });
    };

    vm.editAutoScalingGroup = function (groupName) {
      if (groupName) {
        $uibModal.open({
          templateUrl: '/app/environments/dialogs/env-asg-details-modal.html',
          controller: 'ASGDetailsModalController as vm',
          windowClass: 'InstanceDetails',
          resolve: {
            parameters: function () {
              return {
                groupName: groupName,
                environment: vm.environmentsList[vm.selectedEnvironment],
                accountName: vm.selectedAccount,
                defaultAction: 'launchConfig'
              };
            }
          }
        }).result.then(function () {
          vm.refresh();
        });
      } else {
        modal.information({
          title: 'Not part of ASG',
          message: 'This operation is not available as this AMI doesn\'t belong to an ASG.',
          severity: 'Info'
        });
      }
    };

    init();
  });

