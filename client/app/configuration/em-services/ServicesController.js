/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

// Manage all services
angular.module('EnvironmentManager.configuration').controller('ServicesController',
  function ($scope, $routeParams, $location, $http, resources, cachedResources, modal, localstorageservice) {
    var vm = this;
    var SHOW_ALL_OPTION = 'Any';

    vm.itemsPerPage = 20;

    vm.fullData = [];
    vm.data = [];
    vm.owningClustersList = [];
    vm.selectedOwningCluster = SHOW_ALL_OPTION;
    vm.selectedService = '';

    function init() {
      vm.dataLoading = true;
      $scope.canPost = user.hasPermission({ access: 'POST', resource: '/config/services/**' });

      var cluster = $routeParams.cluster;
      var service = $routeParams.service;

      vm.selectedOwningCluster = cluster || localstorageservice.getValueOrDefault('em-selections-team', SHOW_ALL_OPTION);
      vm.selectedService = service || '';

      cachedResources.config.clusters.all().then(function (clusters) {
        vm.owningClustersList = [SHOW_ALL_OPTION].concat(_.map(clusters, 'ClusterName')).sort();
      }).then(function () {
        vm.refresh();
      });
    }

    vm.newItem = function () {
      $location.path('/config/services/new');
    };

    vm.refresh = function () {
      var query = {};

      localstorageservice.set('em-selections-team', vm.selectedOwningCluster);
      
      if (vm.selectedOwningCluster != SHOW_ALL_OPTION) {
        query.cluster = vm.selectedOwningCluster;
      }

      $http.get('/api/v1/config/services', { params: query }).then(function (response) {
        var data = response.data;
        vm.fullData = _.sortBy(data, 'ServiceName');
        vm.updateFilter();
        $scope.canDelete = false;

        for (var i in vm.data) {
          var service = vm.data[i];
          var canDelete = user.hasPermission({ access: 'DELETE', resource: '/config/services/' + service.Name });
          if (canDelete) {
            $scope.canDelete = true;
            break;
          }
        }

        vm.dataLoading = false;
      });
    };

    $scope.canUser = function (action) {
      if (action === 'post') return $scope.canPost;
      if (action === 'delete') return $scope.canDelete;
    };

    vm.updatePagedData = function () {
      vm.data = vm.filteredData.slice(vm.itemsPerPage * (vm.currentPage - 1), vm.itemsPerPage * vm.currentPage);
    };

    vm.updateFilter = function () {
      vm.currentPage = 1;
      $location.search('cluster', vm.selectedOwningCluster);
      $location.search('service', vm.selectedService || null);
      vm.filteredData = vm.fullData.filter(function (service) {
        return (vm.selectedService === '' || angular.lowercase(service.ServiceName).indexOf(angular.lowercase(vm.selectedService)) != -1);
      });

      vm.updatePagedData();
    };

    vm.delete = function (service) {
      var serviceName = service.ServiceName;
      var owningCluster = service.OwningCluster;
      var expectedVersion = service.Version;

      modal.confirmation({
        title: 'Deleting a Service',
        message: 'Are you sure you want to delete the <strong>' + serviceName + '</strong> service?',
        action: 'Delete',
        severity: 'Danger',
        details: ['NOTE: This will not delete the service from any Deployment Maps or Load Balancer Rules. It will also not clear any AWS resources associated with the service. Clean up of these needs to be done manually. Deleting services in Environment Manager before they are fully removed from AWS and Footplate is not a good idea! <strong>Please talk to the Server team if unsure</strong>.'] // TODO:
      }).then(function () {
        var params = { key: serviceName, range: owningCluster, expectedVersion: expectedVersion };
        resources.config.services.delete(params).then(function () {
          cachedResources.config.services.flush();
          vm.refresh();
        });
      });
    };

    vm.viewDeployments = function (service) {
      $location.search('servicename', service.ServiceName);
      $location.path('/operations/deployments/');
    };

    vm.viewHistory = function (service) {
      $scope.ViewAuditHistory('Service', service.ServiceName, service.OwningCluster);
    };

    init();
  });

