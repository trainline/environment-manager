/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.configuration').controller('ExportController',
  function ($scope, $location, resources, cachedResources, FileSaver, Blob) {

    $scope.Resources = [];
    $scope.SelectedResource = '';
    $scope.AccountsList = [];
    $scope.SelectedAccount = '';
    $scope.ExportData = '';
    $scope.DataLoading = false;

    function init() {
      cachedResources.aws.accounts.all().then(function (accounts) {
        $scope.AccountsList = accounts.sort();
      }).then(function () {
        var asResourceDescriptor = function (resource) {
          return {
            name: resource.Value.name(),
            description: resource.Value.description(),
          };
        };

        $scope.Resources = Enumerable.From(resources.config).Select(asResourceDescriptor).ToArray();
        $scope.SelectedResource = $scope.Resources[0].name;
        $scope.SelectedAccount = $scope.AccountsList[0];
      });
    }

    $scope.Export = function () {
      var params = {};
      if ($scope.IsSelectedResourceCrossAccount()) {
        params['account'] = $scope.SelectedAccount;
      }

      $scope.DataLoading = true;
      var resource = resources.config[$scope.SelectedResource];
      resource.export(params).then(function (data) {
        $scope.ExportData = JSON.stringify(data, null, 4);
      }).finally(function () {
        $scope.DataLoading = false;
      });
    };

    $scope.Download = function () {
      var params = {};
      if ($scope.IsSelectedResourceCrossAccount()) {
        params['account'] = $scope.SelectedAccount;
      }

      var resource = resources.config[$scope.SelectedResource];
      resource.export(params).then(function (data) {
        var json = JSON.stringify(data, null, 4);
        var data = new Blob([json], { type: 'application/json;charset=utf-8' });
        var timestamp = new Date().toLocaleDateString().replace('/', '-');
        FileSaver.saveAs(data, $scope.SelectedResource + '-' + timestamp + '.json');
      });
    };

    $scope.IsSelectedResourceCrossAccount = function () {
      return ($scope.SelectedResource == 'lbSettings' || $scope.SelectedResource == 'lbUpstream');
    };

    init();
  });
