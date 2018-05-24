/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.operations').controller('OpsServiceInstallCheckModalController',
  function ($scope, $uibModalInstance, $q, $http, service) {
    var vm = this;
    $scope.service = service;
    

    vm.checkInstallation = function (service) {
        $scope.DataLoading = true;
        $http({
          method: 'get',
          url: '/api/v1/services/' + service.simpleName + '/installationcheck/'+service.slice +'?environment=' + service.environment
        }).then(function (response) {
          $scope.Nodes = response.data;
          
        }).finally(function () {
            $scope.DataLoading = false;
        });
    };
    
    function init() {
        vm.checkInstallation(service);
    }

    $scope.Ok = function () {
      $uibModalInstance.close();
    };
    init();
  });

