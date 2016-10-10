/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.configuration').controller('ExportController',
  function ($scope, $location, resources, cachedResources, FileSaver, Blob) {
    var vm = this;

    vm.resources = [];
    vm.selectedResource = '';
    vm.accountsList = [];
    vm.selectedAccount = '';
    vm.exportData = '';
    vm.dataLoading = false;

    function init() {
      cachedResources.config.accounts.all().then(function (accounts) {
        accounts = _.map(accounts, 'AccountName');
        vm.accountsList = accounts.sort();
      }).then(function () {
        var asResourceDescriptor = function (resource) {
          return {
            name: resource.Value.name(),
            description: resource.Value.description(),
          };
        };

        vm.resources = Enumerable.From(resources.config).Select(asResourceDescriptor).ToArray();
        vm.selectedResource = vm.resources[0].name;
        vm.selectedAccount = vm.accountsList[0];
      });
    }

    vm.export = function () {
      var params = {};
      if (vm.isSelectedResourceCrossAccount()) {
        params['account'] = vm.selectedAccount;
      }

      vm.dataLoading = true;
      var resource = resources.config[vm.selectedResource];
      resource.export(params).then(function (data) {
        vm.exportData = JSON.stringify(data, null, 4);
      }).finally(function () {
        vm.dataLoading = false;
      });
    };

    vm.download = function () {
      var params = {};
      if (vm.isSelectedResourceCrossAccount()) {
        params['account'] = vm.selectedAccount;
      }

      var resource = resources.config[vm.selectedResource];
      resource.export(params).then(function (data) {
        var json = JSON.stringify(data, null, 4);
        var data = new Blob([json], { type: 'application/json;charset=utf-8' });
        var timestamp = new Date().toLocaleDateString().replace('/', '-');
        FileSaver.saveAs(data, vm.selectedResource + '-' + timestamp + '.json');
      });
    };

    vm.isSelectedResourceCrossAccount = function () {
      return (vm.selectedResource == 'lbSettings' || vm.selectedResource == 'lbUpstream');
    };

    init();
  });
