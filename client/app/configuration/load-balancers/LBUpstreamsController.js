/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

// Manage Load Balancer Upstreams
angular.module('EnvironmentManager.configuration').controller('LBUpstreamsController',
  function ($scope, $routeParams, $location, $q, modal, resources, cachedResources, accountMappingService) {

    $scope.EnvironmentsList = [];
    $scope.SelectedEnvironment = '';
    $scope.SelectedService = '';

    $scope.FullData = [];
    $scope.Data = [];
    $scope.DataLoading = false;

    function init() {

      $scope.canPost = user.hasPermission({ access: 'POST', resource: '/*/config/lbupstream/*' });

      $location.search('key', null);
      $location.search('mode', null);
      var env = $routeParams['up_environment'];
      var serviceFilter = $routeParams['serviceFilter'];

      if (serviceFilter) $scope.SelectedService = serviceFilter;

      $q.all([
        cachedResources.config.environments.all().then(function (environments) {
          $scope.EnvironmentsList = _.map(environments, 'EnvironmentName').sort();
        }),
      ]).then(function () {
        $scope.SelectedEnvironment = env ? env : $scope.EnvironmentsList[0];
        $scope.Refresh();
      });
    }

    $scope.canUser = function (action) {
      if (action == 'post') return $scope.canPost;
      if (action == 'delete') return $scope.canDelete;
    };

    $scope.Refresh = function () {
      $scope.DataLoading = true;
      var params = { account: 'all' };
      resources.config.lbUpstream.all(params).then(function (data) {
        $scope.FullData = data;
      }).finally(function () {
        $scope.UpdateFilter();
        $scope.DataLoading = false;
      });
    };

    $scope.UpdateFilter = function () {
      $location.search('up_environment', $scope.SelectedEnvironment);
      $location.search('serviceFilter', $scope.SelectedService);
      $scope.Data = $scope.FullData.filter(function (upstream) {
        var match = true;
        match = match && upstream.Value.EnvironmentName == $scope.SelectedEnvironment;
        var serviceName = angular.lowercase(upstream.Value.ServiceName);
        if ($scope.SelectedService) {
          if (!serviceName) return false;
          match = match && serviceName.indexOf(angular.lowercase($scope.SelectedService)) != -1;
        }

        return match;
      });
    };

    $scope.NewItem = function () {
      $location.search('mode', 'New');
      $location.path('/config/upstream');
    };

    $scope.Edit = function (upstream) {
      $location.search('mode', 'Edit');
      $location.search('key', encodeURIComponent(upstream.key));
      $location.path('/config/upstream');
    };

    $scope.Copy = function (upstream) {
      $location.search('mode', 'Copy');
      $location.search('key', encodeURIComponent(upstream.key));
      $location.path('/config/upstream/');
    };

    $scope.ViewHistory = function (upstream) {
      $scope.ViewAuditHistory('LB Upstream', encodeURIComponent(upstream.key));
    };

    $scope.Delete = function (upstream) {
      var key = upstream.key;
      var name = upstream.Value.UpstreamName;
      var env = upstream.Value.EnvironmentName;
      var accountName = '';
      var lbSettings = [];

      accountMappingService.GetAccountForEnvironment($scope.SelectedEnvironment).then(function (acName) {
        accountName = acName;

        resources.config.lbSettings.all({ account: 'all' }).then(function (data) {
          lbSettings = data;
        }).then(function () {

          // Check whether upstream in use
          var inUseBy = lbSettings.filter(function (setting) {
            return UpstreamInUse(name, setting);
          });

          if (inUseBy.length > 0) {

            modal.information({
              title: 'Upstream in Use',
              message: 'Upstream <strong>' + name + '</strong> cannot be deleted because it is being referenced by the following Load Balancer settings:',
              details: _.map(inUseBy, 'VHostName').sort(), // list of LBs that use it in this environment
            });

          } else {

            // Confirm
            modal.confirmation({
              title: 'Deleting a Load Balancer Upstream',
              message: 'Are you sure you want to delete the <strong>' + name + '</strong> Upstream from ' + env + '?',
              action: 'Delete',
              severity: 'Danger',
            }).then(function () {
              var params = {
                account: accountName,
                key: key,
              };
              resources.config.lbUpstream.delete(params).then(function () {
                cachedResources.config.lbUpstream.flush();
                $scope.Refresh();
              });
            });
          }

        });
      });
    };

    function UpstreamInUse(upstreamName, lbSetting) {
      var inUse = false;
      lbSetting.Value.Locations.forEach(function (location) {
        if (location.ProxyPass) {
          var proxyUpstreamName = location.ProxyPass.replace('http://', '').replace('https://', '');
          if (proxyUpstreamName == upstreamName) {
            inUse = true;
            return;
          }
        }
      });

      return inUse;
    }

    init();
  });
