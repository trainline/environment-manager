/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').controller('MaintenanceAddServerModalController',
  function ($scope, $uibModalInstance, $q, resources, cachedResources, awsService, defaultAccount, instancesService) {

    $scope.AccountsList = [];
    $scope.SelectedAccount = '';
    $scope.ServerSearch = '';
    $scope.ServerDetails = {};

    $scope.SearchPerformed = false;
    $scope.DataFound = false;

    var SHOW_ALL_OPTION = 'All';

    function init() {
      cachedResources.config.accounts.all().then(function (accounts) {
        accounts = _.map(accounts, 'AccountName');
        $scope.AccountsList = accounts.sort();
        $scope.SelectedAccount = (defaultAccount == SHOW_ALL_OPTION) ? accounts[0] : defaultAccount;
      });
    }

    $scope.Ok = function () {
      var newServer = $scope.ServerDetails;
      instancesService.setMaintenanceMode($scope.SelectedAccount, newServer.InstanceId, true).then(function () {
        $uibModalInstance.close();
      });

    };

    $scope.Cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.Search = function () {

      $scope.SearchPerformed = true;
      $scope.ServerSearch = $scope.ServerSearch.trim();

      var filterType = '';

      // Allow searching by IP or instance id
      if (IsIPv4($scope.ServerSearch)) {
        filterType = 'private-ip-address';
      } else if ($scope.ServerSearch.startsWith('i-')) {
        filterType = 'instance-id';
      } else {
        $scope.ServerDetails = {};
        $scope.DataFound = false;
        return;
      }

      var params = {
        account: $scope.SelectedAccount,
        query: {},
      };
      params.query[filterType] = $scope.ServerSearch;

      awsService.instances.GetInstanceDetails(params).then(function (data) {
        $scope.ServerDetails = data[0] || {};
        $scope.DataFound = (data.length > 0);
      }, function (error) {

        $scope.ServerDetails = {};
        $scope.DataFound = false;
      });

    };

    function IsIPv4(value) {
      var match = value.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
      return match != null && match[1] <= 255 && match[2] <= 255 && match[3] <= 255 && match[4] <= 255;
    }

    init();
  });
