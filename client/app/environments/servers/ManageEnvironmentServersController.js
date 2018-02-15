/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments')
  .controller('ManageEnvironmentServersController',
  function ($rootScope, $routeParams, $http, $q, cachedResources, resources, $uibModal, accountMappingService, serversView, QuerySync, environmentDeploy, $scope, serviceDiscovery, enums, modal, asgservice, teamstorageservice) {
    var vm = this;

    var SHOW_ALL_OPTION = 'Any';
    vm.roleInformation = false;

    var querySync = new QuerySync(vm, {
      environment: {
        property: 'selected.environment.EnvironmentName',
        default: $rootScope.WorkingEnvironment.EnvironmentName
      },
      status: {
        property: 'selected.status',
        default: SHOW_ALL_OPTION
      },
      cluster: {
        property: 'selected.cluster',
        default: teamstorageservice.get(SHOW_ALL_OPTION)
      },
      server: {
        property: 'selected.serverRole',
        default: ''
      },
      service: {
        property: 'selected.serviceName',
        default: ''
      },
      asg_name: {
        property: 'openAsgName',
        default: null
      }
    });

    function init() {
      vm.dataLoading = true;
      vm.dataFound = false;

      vm.options = {
        statuses: [SHOW_ALL_OPTION, 'Healthy', 'Warning', 'Error'],
        clusters: [SHOW_ALL_OPTION]
      };

      vm.selected = {
        environment: {}
      };

      querySync.init();

      var environmentName = vm.selected.environment.EnvironmentName;
      localstorageservice.set(localstorageservice.keys.selections.environment, environmentName);
      $rootScope.WorkingEnvironment.EnvironmentName = environmentName;

      $q.all([
        cachedResources.config.clusters.all().then(function (clusters) {
          vm.options.clusters = vm.options.clusters.concat(_.map(clusters, 'ClusterName')).sort();
        }),

        cachedResources.config.environments.all().then(function (envData) {
          vm.selected.environment = cachedResources.config.environments.getByName(environmentName, 'EnvironmentName', envData);
        }),

        accountMappingService.getAccountForEnvironment(vm.selected.environment.EnvironmentName).then(function (account) {
          vm.selected.account = account;
        })
      ]).then(function () {
        if (vm.openAsgName !== null) {
          vm.showInstanceDetails(vm.openAsgName);
        }

        vm.refresh();
      });
    }

    vm.refresh = function () {
      vm.roleInformation = false;
      querySync.updateQuery();

      vm.dataLoading = true;
      var promise = $http({
        url: '/api/v1/environments/' + vm.selected.environment.EnvironmentName + '/servers'
      }).then(function (response) {
        var data = response.data;
        vm.data = data;
        vm.dataFound = data.Value && data.Value.length > 0;

        var healthTemplate = [
          '<h1><span class="glyphicon glyphicon-question-sign"></span> What is Healthy</h1>',
          '<p><strong>System Status Checks</strong> (the system is reachable) is <strong>passing</strong>',
          '<p><strong>Instance Status Checks</strong> (the operating system is accepting traffic) is <strong>passing</p></p>'
        ].join('\n');

        if (vm.dataFound) {
          vm.update()
            .then(function () {
              Tipped.create('.tooltip-healthy', $('<p/>').html(healthTemplate), { position: 'topleft' });
            });
        }
      });

      promise.finally(function () {
        vm.dataLoading = false;
      });

      return promise;
    };

    vm.canDeleteAsg = function (asgName) {
      return user.hasPermission({ access: 'DELETE', resource: '/asgs/' + asgName });
    }

    vm.deleteAsg = function (asgName) {
      deleteAsgConfirmationModal(asgName)
        .then(function () {
          var params = {
            environmentName: vm.selected.environment.EnvironmentName,
            asgName: asgName
          };
          return asgservice.delete(params);
        });
    }

    function deleteAsgConfirmationModal(asgName) {
      return modal.confirmation({
        title: 'WARNING!!! Deleting ASG: ' + asgName,
        message:
        'Are you sure you want to delete this ASG: <strong>' + asgName + '</strong>?<br />',
        action: 'Delete ASG',
        severity: 'Danger',
        acknowledge: 'I am sure I want to delete this ASG: ' + asgName + '.'
      });
    }

    vm.update = function () {
      querySync.updateQuery();
      vm.view = serversView(vm.data, vm.selected)
      teamstorageservice.set(vm.selected.cluster);
      return $q.resolve();
    };

    vm.loadDeployDialog = function () {
      $uibModal.open({
        templateUrl: '/app/environments/dialogs/env-deploy-modal.html',
        controller: 'DeployModalController as vm',
        size: 'lg',
        resolve: {
          parameters: function () {
            return {
              Environment: vm.selected.environment
            };
          }
        }
      });
    };

    vm.showInstanceDetails = function (asgName, action) {
      vm.openAsgName = asgName;
      querySync.updateQuery();

      var modal = $uibModal.open({
        templateUrl: '/app/environments/dialogs/env-asg-details-modal.html',
        controller: 'ASGDetailsModalController as vm',
        windowClass: 'InstanceDetails',
        resolve: {
          parameters: function () {
            return {
              groupName: asgName,
              environment: vm.selected.environment,
              accountName: vm.selected.account,
              defaultAction: action
            };
          }
        }
      });

      modal.result.finally(function () {
        vm.openAsgName = null;
        querySync.updateQuery();
      });
    };

    environmentDeploy.registerDeployHandler(vm.loadDeployDialog);

    init();
  });

