/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

// Manage Load Balancer settings
angular.module('EnvironmentManager.configuration').controller('LBsController',
  function ($scope, $routeParams, $location, $q, $uibModal, modal, resources, cachedResources, accountMappingService, lbBulkOperationService) {

    var SHOW_ALL_OPTION = 'All';

    $scope.FullData = [];
    $scope.Data = [];
    $scope.DataLoading = false;

    $scope.EnvironmentsList = [];
    $scope.SettingTypeList = [SHOW_ALL_OPTION, 'Front End', 'Back End'];
    $scope.SelectedEnvironment = '';
    $scope.SelectedSettingType = SHOW_ALL_OPTION;
    $scope.SelectedServer = '';

    function init() {

      $scope.canPost = user.hasPermission({ access: 'POST', resource: '/*/config/lbsettings/**' });

      $location.search('range', null);
      $location.search('mode', null);
      $location.search('returnPath', null);
      $location.search('key', null);
      $location.search('up_environment', null);
      var env = $routeParams['lb_environment'];
      var typeFilter = $routeParams['typeFilter'];
      var serverFilter = $routeParams['serverFilter'];

      if (typeFilter) $scope.SelectedSettingType = typeFilter;
      if (serverFilter) $scope.SelectedServer = serverFilter;

      $q.all([
        cachedResources.config.environments.all().then(function (environments) {
          $scope.EnvironmentsList = _.map(environments, 'EnvironmentName').sort();
        }),

        cachedResources.config.accounts.all().then(function (accounts) {
          accounts = _.map(accounts, 'AccountName');
          $scope.AccountsList = [SHOW_ALL_OPTION].concat(accounts).sort();
        }),
      ]).then(function () {
        $scope.SelectedEnvironment = env ? env : $scope.EnvironmentsList[0];
        $scope.Refresh();
      });
    }

    $scope.canUser = function (action) {
      if (action == 'post') return $scope.canPost;
      if (action == 'delete') return $scope.canDelete;
      if (action == 'delete-all') return $scope.canDelete == $scope.Data.length;
    };

    $scope.Refresh = function () {

      $scope.DataLoading = true;

      accountMappingService.getAccountForEnvironment($scope.SelectedEnvironment).then(function (accountName) {
        var params = {
          account: accountName,
          query: {
            EnvironmentName: $scope.SelectedEnvironment,
          },
        };

        if ($scope.SelectedSettingType != SHOW_ALL_OPTION) {
          params.query['Value.FrontEnd'] = $scope.SelectedSettingType == 'Front End' ? true : false;
        }

        resources.config.lbSettings.all(params).then(function (data) {
          $scope.FullData = data;
        }).finally(function () {
          $scope.UpdateFilter(accountName);
          $scope.DataLoading = false;
        });
      });
    };

    $scope.UpdateFilter = function (accountName) {
      $location.search('lb_environment', $scope.SelectedEnvironment);
      $location.search('typeFilter', $scope.SelectedSettingType);
      $location.search('serverFilter', $scope.SelectedServer);
      $scope.Data = $scope.FullData.filter(function (lb) {
        var match = true;
        if ($scope.SelectedServer) {
          match = false;
          if (lb.Value.ServerName) {
            lb.Value.ServerName.forEach(function (fqdn) {
              if (angular.lowercase(fqdn).indexOf(angular.lowercase($scope.SelectedServer)) > -1) {
                match = true;
              }
            });
          }
        }

        return match;
      });

      $scope.canDelete = 0;
      for (var i in $scope.Data) {
        var lb = $scope.Data[i];
        var canDelete = user.hasPermission({ access: 'DELETE', resource: '/' + accountName + '/config/lbsettings/' + lb.EnvironmentName + '/' + lb.VHostName });
        if (canDelete) {
          $scope.canDelete++;
        }
      };
    };

    $scope.NewItem = function () {
      $location.search('mode', 'New');
      $location.path('/config/loadbalancer');
    };

    $scope.Edit = function (lb) {
      $location.search('mode', 'Edit');
      $location.search('range', lb.VHostName);
      $location.path('/config/loadbalancer');
    };

    $scope.Copy = function (lb) {
      $location.search('mode', 'Copy');
      $location.search('range', lb.VHostName);
      $location.path('/config/loadbalancer');
    };

    $scope.ViewHistory = function (lb) {
      $scope.ViewAuditHistory('LB Setting', lb.VHostName, lb.EnvironmentName);
    };

    $scope.Delete = function (lb) {
      var env = lb.EnvironmentName;
      var hostName = lb.VHostName;

      modal.confirmation({
        title: 'Deleting a Load Balancer Setting',
        message: 'Are you sure you want to delete the <strong>' + hostName + '</strong> setting from ' + env + '?',
        action: 'Delete',
        severity: 'Danger',
      }).then(function () {

        accountMappingService.getAccountForEnvironment(env).then(function (accountName) {
          DeleteLBSetting(accountName, env, hostName).then(function () {
            $scope.Refresh();
          }).finally(function () {
            cachedResources.config.lbSettings.flush();
          });
        });

      });
    };

    $scope.CloneEnvironment = function () {
      // TODO: Not wired in yet
      var instance = $uibModal.open({
        templateUrl: '/app/configuration/load-balancers/lb-clone-modal.html',
        controller: 'LBCloneController',
        resolve: {
          sourceEnv: function () {
            return $scope.SelectedEnvironment;
          },
        },
      }).result.then(function () {
        $scope.Refresh();
      });
    };

    $scope.DeleteAllRules = function () {
      var env = $scope.SelectedEnvironment;
      modal.confirmation({
        title: 'Delete All Settings for Environment',
        message: 'Are you sure you want to delete <strong>ALL</strong> Load Balancer settings for environment <strong>' + env + '</strong>? <br/><br/>This action cannot be undone.',
        action: 'Delete All Settings for ' + env,
        severity: 'Danger',
      }).then(function () {
        DeleteAllLBSettings(env);
      });
    };

    $scope.GetLocationSummary = function (lb) {
      var locationInfo = [];
      if (lb.Locations) {
        for (var i = 0; i < lb.Locations.length; i++) {
          if (lb.Locations[i]) {
            locationInfo.push(lb.Locations[i].Path);
          }
        }
      }

      return locationInfo;
    };

    $scope.GetUpstreams = function (lb) {
      var upstreams = [];
      lb.Locations.forEach(function (location) {
        if (location.ProxyPass) {
          var upstreamName = location.ProxyPass.replace('http://', '').replace('https://', '');
          if (upstreams.indexOf(upstreamName) == -1) upstreams.push(upstreamName);
        }
      });

      return upstreams;
    };

    $scope.GoToUpstream = function (upstreamName) {
      cachedResources.config.lbUpstream.all().then(function (upstreams) {
        var upstream = upstreams.filter(function (up) {
          return up.Value.UpstreamName == upstreamName;
        });

        if (upstream && upstream.length == 1) {
          upstream = upstream[0];
          $location.search('key', encodeURIComponent(upstream.key));
          $location.search('up_environment', upstream.Value.EnvironmentName);
          $location.search('returnPath', encodeURIComponent('/config/loadbalancers'));
          $location.path('/config/upstream/');
        }
      });
    };

    function DeleteAllLBSettings(env) {
      accountMappingService.getAccountForEnvironment(env).then(function (accountName) {
        $q.all(
          $scope.Data.forEach(function (lbSetting) {
            return DeleteLBSetting(accountName, env, lbSetting.VHostName);
          })
        ).then(function () {
          $scope.Refresh();
        });
      });
    }

    function DeleteLBSetting(accountName, environment, vHostName) {
      var params = {
        account: accountName,
        key: environment,
        range: vHostName,
      };
      return resources.config.lbSettings.delete(params);
    }

    init();
  });

