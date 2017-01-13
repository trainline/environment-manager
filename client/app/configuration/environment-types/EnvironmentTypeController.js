/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

// Manage specific environment type
angular.module('EnvironmentManager.configuration').controller('EnvironmentTypeController',
  function ($scope, $routeParams, $location, $q, $http, $log, $window, resources, cachedResources, schemaValidatorService) {
    var vm = $scope;
    var RETURN_PATH = '/config/environmenttypes';
    var accountsResource = cachedResources.config.accounts;

    vm.EnvironmentType = {};
    vm.EditMode = false;
    vm.DataFound = false;
    vm.EnvironmentTypeNames = [];
    vm.Version = 0;
    vm.awsAccount = {};
    vm.accountNotFound = false;

    var configStructure = {
      SchemaVersion: 5,
      AWSAccountName: '',
      AWSAccountNumber: '',
      NamingPattern: '',
      Consul: {
        DataCenter: '',
        Port: 8500,
        Servers: [],
        SecurityTokenPath: ''
      },
      DeploymentBucket: '',
      LoadBalancers: [],
      Subnets: {
        PrivateApp: {
          AvailabilityZoneA: '',
          AvailabilityZoneB: ''
        }
      },
      VpcId: ''
    };
    vm.DefaultValue = angular.toJson(configStructure, 4);
    vm.Cancel = navigateToList;

    $scope.rawNamePattern = '';
    $scope.escapeNamingPattern = function () {
      var doc = angular.fromJson(vm.EnvironmentType.Value);
      doc.NamingPattern = $scope.rawNamePattern;
      vm.EnvironmentType.Value = angular.toJson(doc, 4);
    };

    function init() {
      var environmentType = $routeParams.environmenttype;
      vm.EditMode = !(environmentType.toLowerCase() == 'new');
      var access = vm.EditMode ? 'PUT' : 'POST';
      var resource = vm.EditMode ? environmentType : '*';
      vm.userHasPermission = user.hasPermission({ access: access, resource: '/config/environmenttypes/' + resource });

      $log.log('Initialising Environment Type Controller for ' + environmentType);

      $q.all([
        resources.config.environmentTypes.all().then(function (environmentTypes) {
          vm.EnvironmentTypeNames = _.map(environmentTypes, 'EnvironmentType');
        }),
        accountsResource.all().then(function (awsAccounts) {
          vm.awsAccounts = awsAccounts;
        })
      ]).then(function () {
        if (vm.EditMode) readItem(environmentType);
        vm.EnvironmentType.Value = vm.DefaultValue;
      });
    }

    vm.canUser = function () {
      return vm.userHasPermission;
    };

    vm.Save = function () {
      var promise;
      var environmentTypeName = vm.EnvironmentType.EnvironmentType;
      var value = angular.fromJson(vm.EnvironmentType.Value);
      if (vm.EditMode) {
        promise = $http({
          method: 'put',
          url: '/api/v1/config/environment-types/' + environmentTypeName,
          data: value,
          headers: { 'expected-version': vm.Version }
        });
      } else {
        promise = $http({
          method: 'post',
          url: '/api/v1/config/clusters',
          data: {
            EnvironmentType: environmentTypeName,
            Value: value
          },
          headers: { 'expected-version': vm.Version }
        });
      }

      promise.then(function () {
        cachedResources.config.environmentTypes.flush();
        navigateToList();
      });
    };

    vm.ValidateJson = function (value) {
      var validator = schemaValidatorService('EnvironmentType');
      return validator(value);
    };

    vm.selectAccount = function () {
      var doc = angular.fromJson(vm.EnvironmentType.Value);
      doc.AWSAccountNumber = String(vm.awsAccount.AccountNumber);
      doc.AWSAccountName = vm.awsAccount.AccountName;
      vm.EnvironmentType.Value = angular.toJson(doc, 4);

      vm.accountNotFound = false;
    };

    function findAWSAccountFromConfig(config) {
      var accountByName = accountsResource.getByName(config.AWSAccountName, 'AccountName', vm.awsAccounts);
      if (!accountByName || String(accountByName.AccountNumber) !== config.AWSAccountNumber) {
        vm.accountNotFound = true;
      } else {
        vm.awsAccount = accountByName;
      }
    }

    function navigateToList() {
      $location.path(RETURN_PATH);
    }

    function readItem(name) {
      resources.config.environmentTypes.get({ key: name }).then(function (data) {
        findAWSAccountFromConfig(data.Value);

        vm.DataFound = true;
        vm.EnvironmentType = data;
        vm.EnvironmentType.Value = angular.toJson(data.Value, 4);
        vm.Version = data.Version;
        $scope.rawNamePattern = JSON.parse(data.Value).NamingPattern;
      }, function () {
        vm.DataFound = false;
      });
    }

    init();
  });
