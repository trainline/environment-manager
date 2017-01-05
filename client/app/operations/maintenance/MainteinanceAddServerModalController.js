/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').controller('MaintenanceAddServerModalController',
  function ($uibModalInstance, $http, $q, resources, cachedResources, awsService, defaultAccount, instancesService) {
    var vm = this;

    vm.accountsList = [];
    vm.selectedAccount = '';
    vm.serverSearch = '';
    vm.serverDetails = {};

    vm.searchPerformed = false;
    vm.dataFound = false;

    var SHOW_ALL_OPTION = 'All';

    function init() {
      cachedResources.config.accounts.all().then(function (accounts) {
        accounts = _.map(accounts, 'AccountName');
        vm.accountsList = accounts.sort();
        vm.selectedAccount = (defaultAccount == SHOW_ALL_OPTION) ? accounts[0] : defaultAccount;
      });
    }

    vm.ok = function () {
      var newServer = vm.serverDetails;
      instancesService.setMaintenanceMode(vm.selectedAccount, newServer.InstanceId, true).then(function () {
        $uibModalInstance.close();
      });

    };

    vm.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    vm.search = function () {

      vm.searchPerformed = true;
      vm.serverSearch = vm.serverSearch.trim();

      var filterType = '';

      // Allow searching by IP or instance id
      if (IsIPv4(vm.serverSearch)) {
        filterType = 'ip_address';
      } else if (_.startsWith(vm.serverSearch, 'i-')) {
        filterType = 'instance_id';
      } else {
        vm.serverDetails = {};
        vm.dataFound = false;
        return;
      }

      var params = {
        account: vm.selectedAccount,
      };
      params[filterType] = vm.serverSearch;


      $http.get('/api/v1/instances', { params: params }).then(function (response) {
        vm.serverDetails = awsService.instances.getSummaryFromInstance(response.data[0]) || {};
        vm.dataFound = (response.data.length > 0);
      }, function (error) {

        vm.serverDetails = {};
        vm.dataFound = false;
      });

    };

    function IsIPv4(value) {
      var match = value.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
      return match != null && match[1] <= 255 && match[2] <= 255 && match[3] <= 255 && match[4] <= 255;
    }

    init();
  });
