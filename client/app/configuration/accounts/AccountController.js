/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.configuration').controller('AccountController',
  function ($rootScope, $location, $routeParams, $http, cachedResources) {
    var vm = this;
    var accountName = $routeParams.accountName;
    var awsAccounts = cachedResources.config.accounts;

    function findAccount(accounts) {
      return awsAccounts.getByName(accountName, 'AccountName', accounts);
    }

    function loadAccount(account) {
      if (account === null) {
        vm.awsAccountName = accountName;
        vm.loadFailed = true;
      } else {
        vm.awsAccountName = account.AccountName;
        vm.awsAccountNumber = account.AccountNumber;
        vm.isMaster = account.IsMaster;
        vm.roleName = !account.IsMaster ? account.RoleArn.substr(31) : ''; // ARN format makes string length fixed
        vm.includeAMIs = account.IncludeAMIs;
        vm.version = account.Version;
      }
    }

    vm.save = function (form) {
      if (validate(form)) {
        var accountNumber = +vm.awsAccountNumber;
        var includeAMIs = vm.includeAMIs;

        var newAccount = {
          AccountName: vm.awsAccountName,
          AccountNumber: accountNumber,
          IncludeAMIs: includeAMIs
        };

        if (!vm.isMaster) {
          newAccount.RoleArn = 'arn:aws:iam::' + accountNumber + ':role/' + vm.roleName;
        }

        var promise;
        if (vm.isBeingEdited && !!vm.version) {
          promise = $http.put('/api/v1/config/accounts/' + accountNumber, newAccount, { headers: { 'expected-version': vm.version } });
        } else {
          promise = $http.post('/api/v1/config/accounts', newAccount);
        }

        promise.then(function () {
          awsAccounts.flush();
          $location.path('/config/accounts');
        }).catch(function (error) {
          $rootScope.$emit('error', error);
        });
      }
    };

    vm.cancel = function () {
      $location.path('/config/accounts');
    };

    function validate(form) {
      form.awsAccountName.$dirty = true;
      form.awsAccountNumber.$dirty = true;
      return !form.awsAccountName.$invalid && !form.awsAccountNumber.$invalid;
    }

    vm.loadFailed = false;
    vm.isMaster = false;
    vm.includeAMIs = false;
    vm.isBeingEdited = accountName !== 'add';

    if (vm.isBeingEdited) {
      awsAccounts.all().then(findAccount.bind(this)).then(loadAccount.bind(this));
    }
  });
