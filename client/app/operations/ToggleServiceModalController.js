/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').controller('ToggleServiceModalController',
  function ($q, $http, $uibModalInstance, environmentName, resources, cachedResources) {
    var vm = this;

    vm.environmentNames = [];
    vm.serviceNames = [];
    vm.toggledUpstreams = [];
    vm.errorMessage = null;
    vm.upstreamChanged = false;

    vm.environmentName = environmentName;
    vm.serviceName = null;

    vm.close = function () {
      $uibModalInstance.close(vm.upstreamChanged);
    };

    vm.toggle = function () {
      vm.toggledUpstreams = [];
      vm.errorMessage = null;

      $http({
        method: 'put',
        url: '/api/v1/services/' + vm.serviceName + '/slices/toggle?environment=' + vm.environmentName,
        data: {}
      }).then(function (response) {
        vm.toggledUpstreams = response.data.ToggledUpstreams;
        vm.upstreamChanged = true;
      }, function (error) {
        vm.errorMessage = error.data;
      })
    };

    function init() {
      $q.all([
        cachedResources.config.environments.all(),
        cachedResources.config.services.all(),
      ]).then(function (results) {
        vm.environmentNames = _.map(results[0], 'EnvironmentName').sort();
        vm.serviceNames = _.map(results[1], 'ServiceName').sort();
      });
    };

    init();
  });
