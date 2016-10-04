/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.configuration')
  .controller('ImportController', function ($scope, $http, resources, cachedResources, modal) {

    $scope.Resources = [];
    $scope.SelectedResource = '';
    $scope.AccountsList = [];
    $scope.SelectedAccount = '';
    $scope.ImportData = '';
    $scope.InProgress = false;
    $scope.Error = null;
    $scope.ForceDelete = false;

    function asResourceDescriptor(resource) {
      return {
        name: resource.Value.name(),
        description: resource.Value.description(),
      };
    }

    function init() {

      cachedResources.aws.accounts.all().then(function (accounts) {
        $scope.AccountsList = accounts.sort();
      }).then(function () {
        
        $scope.Resources = Enumerable.From(resources.config).Select(asResourceDescriptor).ToArray();
        $scope.SelectedResource = $scope.Resources[0].name;
        $scope.SelectedAccount = $scope.AccountsList[0];
      });
    };

    $scope.Import = function () {

      if (!$scope.ImportData) {
        $scope.Error = 'Please enter some data to import first';
        return;
      }

      var appendImportConfirmParams = {
        title: 'Importing Configuration Data',
        message: 'Are you sure you want to import <strong>' + $scope.SelectedResource + '</strong> data?',
        action: 'Import',
        severity: 'Warning',
        details: ['This action will add new records but not delete or affect any existing data'],
      };
      var deleteImportConfirmParams = {
        title: 'Importing Configuration Data',
        message: 'Are you sure you want to <span class="warning">delete and overwrite</span> all <strong>' + $scope.SelectedResource + '</strong> data?',
        action: 'Delete and Import',
        severity: 'Danger',
        details: ['This action will blank all existing ' + $scope.SelectedResource + ' data and replace it with the values specified. This action cannot be undone. Please be extremely careful!'],
      };

      var confirmParams = $scope.ForceDelete ? deleteImportConfirmParams : appendImportConfirmParams;

      modal.confirmation(confirmParams).then(function () {

        $scope.InProgress = true;
        $scope.Error = null;

        var params = {
          mode: $scope.ForceDelete ? 'replace' : 'merge',
        };
        if ($scope.IsSelectedResourceCrossAccount()) {
          params['account'] = $scope.SelectedAccount;
        }

        $http({
          url: '/api/v1/config/import/' + $scope.SelectedResource.toLowerCase(),
          method: 'put',
          data: $scope.ImportData,
          params: params,
        }).then(function () {
          $scope.InProgress = false;
        }, function (error) {

          $scope.InProgress = false;
          $scope.Error = error.data;
        });

      });
    };

    $scope.IsSelectedResourceCrossAccount = function () {
      return ($scope.SelectedResource == 'lbSettings' || $scope.SelectedResource == 'lbUpstream');
    };

    init();
  });
