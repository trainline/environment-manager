/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.configuration').controller('AccountsController',
  function ($location, $http, cachedResources, modal) {
    var vm = this;

    vm.attemptRemove = function (account) {
      getDependentAccounts(account).then(function (dependents) {
        if (dependents.length) {
          var uses = dependents.map(function(e){ return '<li>' + e.EnvironmentType + '</li>'; }).join('');
          var plural = dependents.length > 1 ? 'Environment Types' : 'Environment Type';
          var pronoun = dependents.length > 1 ? 'these' : 'this';
          modal.information({
            title: 'AWS Account is in use',
            message:
            'The AWS account <strong>' + account.AccountName + '</strong> is currently being used by the following ' + plural + ':<br/><br />' +
            '<ul>' + uses + '</ul>' +
            'Update ' + pronoun + ' ' + plural + ' in order to remove this account.',
            severity: 'Danger'
          });
        } else {
          modal.confirmation({
            title: 'Remove AWS Account',
            message:
            'Are you sure you want to remove the account <strong>' + account.AccountName + '</strong>?<br /><br />' +
            'This will not affect the account itself but could cause problems for Environment Types that rely on this account.',
            action: 'Delete',
            severity: 'Danger'
          }).then(function () {
            removeAccount(account);
          });
        }
      });
    };

    vm.loadData = function () {
      cachedResources.config.accounts.all().then(function (data) {
        updateAccounts(data)
      });
    };

    vm.refreshData = function () {
      cachedResources.config.accounts.flush();
      vm.loadData();
    };

    vm.addNew = function () {
      $location.path('/config/accounts/add');
    };

    function getDependentAccounts(account) {
      return cachedResources.config.environmentTypes.all().then(function (envTypes) {
        return envTypes.filter(function (type) {
          return type.Value.AWSAccountNumber === String(account.AccountNumber);
        });
      });
    }

    function updateAccounts(data) {
      vm.data = data;
    }

    function removeAccount(account) {
      $http.delete('/api/v1/config/accounts/' + account.AccountNumber).then(function () {
        vm.refreshData();
      });
    }

    vm.data = [];
    vm.canPost = user.hasPermission({ access: 'POST', resource: '/config/accounts/*' });
    vm.canDelete = user.hasPermission({ access: 'DELETE', resource: '/config/accounts/*' });

    vm.loadData();
  });
