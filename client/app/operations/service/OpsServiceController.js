/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.operations').controller('OpsServiceController',
  function ($scope, $routeParams, $location, $uibModal, $q, $http, resources, QuerySync, cachedResources, accountMappingService, modal,  environmentstorageservice, teamstorageservice) {
    var vm = this;
    var querySync;
    var SHOW_ALL_OPTION = 'Any';

    vm.environmentsList = [];
    vm.owningClustersList = [];
    vm.statesList = ['All', 'Up', 'Down'];
    vm.servicesData = [];

    vm.fullServiceData = [];
    vm.data = [];
    vm.dataFound = false;
    vm.dataLoading = false;
    vm.ASGDataLoading = false;

    function init() {
      $q.all([
        cachedResources.config.environments.all().then(function (environments) {
          vm.environmentsList = _.map(environments, 'EnvironmentName').sort(function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
          });

          querySync = new QuerySync(vm, {
            environment: {
              property: 'selectedEnvironment',
              default: getDefaultUpstreamEnvironment(environmentstorageservice.get(vm.environmentsList[0]))
            },
            cluster: {
              property: 'selectedOwningCluster',
              default: teamstorageservice.get(SHOW_ALL_OPTION)
            },
            state: {
              property: 'selectedState',
              default: 'Up'
            },
            service: {
              property: 'selectedService',
              default: ''
            }
          });

          querySync.init();
        }),

        cachedResources.config.services.all().then(function (services) {
          vm.servicesData = services;
        }),

        cachedResources.config.clusters.all().then(function (clusters) {
          vm.owningClustersList = [SHOW_ALL_OPTION].concat(_.map(clusters, 'ClusterName')).sort();
        })
      ]).then(function () {
        vm.refresh();
      });
    }

    function getDefaultUpstreamEnvironment(value) {
      return value.toLowerCase() === 'any' ?
        'c01' :
        value;
    }

    vm.refresh = function () {
      vm.dataLoading = true;
      $http({
        method: 'get',
        url: '/api/v1/services?environment=' + vm.selectedEnvironment
      }).then(function (response) {
        vm.fullServiceData = Object.keys(response.data).map(function (service) { return Object.assign({consulName: service}, response.data[service])});
        vm.updateFilter();
      }).finally(function () {
        vm.dataLoading = false;
      });
    };

    vm.updateFilter = function () {
      querySync.updateQuery();
      environmentstorageservice.set(vm.selectedEnvironment);
      teamstorageservice.set(vm.selectedOwningCluster);

      vm.data = vm.fullServiceData.filter(function (service) {
        if (service.environment !== vm.selectedEnvironment) {
          return false;
        }

        if (vm.selectedService && service.simpleName && 
          angular.lowercase(service.simpleName).indexOf(angular.lowercase(vm.selectedService)) < 0) {
            return false;
        }

        if (vm.selectedOwningCluster !== SHOW_ALL_OPTION && service.owning_cluster !== vm.selectedOwningCluster) {
          return false;
        }

        return true;
      });
    };

    vm.showCheckInstallModal = function (service) {
      return $uibModal.open({
        templateUrl: '/app/operations/service/ops-service-installcheck-modal.html',
        controller: 'OpsServiceInstallCheckModalController as vm',
        size: 'lg',
        resolve: {
          service: function () { return service }
        },
      }).result;
    };
    vm.toggleService = function (service) {
      modal.confirmation({
        title: 'Toggling Service',
        message: 'Are you sure you want to toggle <strong>' + service.simpleName + '</strong> in <strong>' + service.environment + '</strong>?',
        details: ['Note, this will toggle <strong>all</strong> upstreams associated with this service'],
        action: 'Toggle Service'
      }).then(function () {
      $http({
        method: 'put',
        url: '/api/v1/services/' + service.simpleName + '/slices/toggle?environment=' + service.environment,
        data: {}
      }).then(function (response) {
        vm.refresh();
      }, function (error) {
        vm.errorMessage = error.data;
      });
    });
    };

    init();
  });

