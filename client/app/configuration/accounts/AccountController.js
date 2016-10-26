/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.configuration').controller('AccountController',
  function ($rootScope, $location, $routeParams, $http, cachedResources) {
    var vm = this;
    var accountName = $routeParams['accountName'];
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
        vm.roleName = !account.IsMaster ? account.RoleArn.substr(31) : ''; //ARN format makes string length fixed
        vm.includeAMIs = account.IncludeAMIs;
      }
    }

    vm.save = function (form) {
      if(validate(form)) {
        var isMaster = !!vm.isMaster;
        var accountNumber = +vm.awsAccountNumber;
        var includeAMIs = vm.includeAMIs;

        var newAccount = {
          AccountName: vm.awsAccountName,
          AccountNumber: accountNumber,
          IsMaster: isMaster,
          IsProd: isMaster,
          Impersonate: !isMaster,
          IncludeAMIs: includeAMIs
        };
        
        if (!isMaster) {
          newAccount.RoleArn = 'arn:aws:iam::' + accountNumber + ':role/' + vm.roleName
        } else {
          // Our dynamo resources don't support deleting properties in updates.
          // This is the next best thing.
          newAccount.RoleArn = null;
        }

        var operation = vm.isBeingEdited ? 'put' : 'post';
        $http[operation]('/api/aws/account', newAccount).then(function() {
          awsAccounts.flush();
          $location.path('/config/accounts');
        }).catch(function(error) {
          $rootScope.$emit('error', error)
        });
      }
    };

    vm.cancel = function() {
      $location.path('/config/accounts');
    };

    function validate(form){
      form.awsAccountName.$dirty = true;
      form.awsAccountNumber.$dirty = true;
      return !form.awsAccountName.$invalid && !form.awsAccountNumber.$invalid;
    }

    vm.loadFailed = false;
    vm.isMaster = true;
    vm.includeAMIs = false;
    vm.isBeingEdited = accountName !== 'add';

    if (vm.isBeingEdited) {
      awsAccounts.all().then(findAccount.bind(this)).then(loadAccount.bind(this));
    }
  });
