/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.configuration')
  .controller('ImportController', function ($http, resources, cachedResources, modal) {
    var vm = this;

    vm.resources = [];
    vm.selectedResource = '';
    vm.accountsList = [];
    vm.selectedAccount = '';
    vm.importData = '';
    vm.inProgress = false;
    vm.error = null;
    vm.forceDelete = false;

    function asResourceDescriptor(resource) {
      return {
        name: resource.Value.name(),
        description: resource.Value.description()
      };
    }

    function init() {
      cachedResources.config.accounts.all().then(function (accounts) {
        accounts = _.map(accounts, 'AccountName');
        vm.accountsList = accounts.sort();
      }).then(function () {
        vm.resources = Enumerable.From(resources.config).Select(asResourceDescriptor).ToArray();
        vm.selectedResource = vm.resources[0].name;
        vm.selectedAccount = vm.accountsList[0];
      });
    }

    vm.import = function () {
      if (!vm.importData) {
        vm.error = 'Please enter some data to import first';
        return;
      }

      var appendImportConfirmParams = {
        title: 'Importing Configuration Data',
        message: 'Are you sure you want to import <strong>' + vm.selectedResource + '</strong> data?',
        action: 'Import',
        severity: 'Warning',
        details: ['This action will add new records but not delete or affect any existing data']
      };
      var deleteImportConfirmParams = {
        title: 'Importing Configuration Data',
        message: 'Are you sure you want to <span class="warning">delete and overwrite</span> all <strong>' + vm.selectedResource + '</strong> data?',
        action: 'Delete and Import',
        severity: 'Danger',
        details: ['This action will blank all existing ' + vm.selectedResource + ' data and replace it with the values specified. This action cannot be undone. Please be extremely careful!']
      };

      var confirmParams = vm.forceDelete ? deleteImportConfirmParams : appendImportConfirmParams;

      modal.confirmation(confirmParams).then(function () {
        vm.inProgress = true;
        vm.error = null;

        var params = {
          mode: vm.forceDelete ? 'replace' : 'merge'
        };
        if (vm.isSelectedResourceCrossAccount()) {
          params.account = vm.selectedAccount;
        }

        $http({
          url: '/api/v1/config/import/' + vm.selectedResource.toLowerCase(),
          method: 'put',
          data: vm.importData,
          params: params
        }).then(function () {
          vm.inProgress = false;
        }, function (error) {
          vm.inProgress = false;
          vm.error = error.data;
        });
      });
    };

    vm.isSelectedResourceCrossAccount = function () {
      return (vm.selectedResource == 'lbSettings' || vm.selectedResource == 'lbUpstream');
    };

    init();
  });

