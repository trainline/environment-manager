/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').controller('MaintenanceAddServerModalController',
  function ($scope, $uibModalInstance, $q, resources, cachedResources, awsService, defaultAccount, instancesService) {

    $scope.AccountsList = [];
    $scope.SelectedAccount = '';
    $scope.ServerSearch = '';
    $scope.ServerDetails = {};

    $scope.SearchPerformed = false;
    $scope.DataFound = false;

    var SHOW_ALL_OPTION = 'All';
    var RECORD_KEY = 'MAINTENANCE_MODE';

    function init() {
      cachedResources.config.accounts.all().then(function (accounts) {
        accounts = _.map(accounts, 'AccountName');
        $scope.AccountsList = accounts.sort();
        $scope.SelectedAccount = (defaultAccount == SHOW_ALL_OPTION) ? accounts[0] : defaultAccount;
      });
    }

    $scope.Ok = function () {

      var newServer = $scope.ServerDetails;


      // Get IPs under Maintenance
      var params = {
        account: $scope.SelectedAccount,
        key: RECORD_KEY,
      };

      resources.asgips.get(params).then(function (data) {

        // Avoid to put the same IP under maintenance twice
        var ipList = data.IPs ? JSON.parse(data.IPs) : [];
        if (ipList.indexOf(newServer.Ip) >= 0) {
          $uibModalInstance.close();
          return;
        }

        ipList.push(newServer.Ip);

        var tasks = [];

        // Add a task to update the IP under maintenance
        tasks.push(resources.asgips.put({
          account: $scope.SelectedAccount,
          key: RECORD_KEY,
          data: { IPs: JSON.stringify(ipList) },
        }));

        // If the instance belongs to an AutoScalingGroup it creates
        // another task to move the instance from service to standby.
        var groupName = newServer['aws:autoscaling:groupName'];
        if (groupName) {
          tasks.push(resources.aws.asgs.enter(groupName)
            .instances([newServer.InstanceId])
            .toStandby()
            .inAWSAccount($scope.SelectedAccount)
            .do());
        }

        instancesService.setMaintenanceMode($scope.SelectedAccount, newServer.InstanceId, true);

        $q.all(tasks).then(function () {
          $uibModalInstance.close();
        });

      });

    };

    $scope.Cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    $scope.Search = function () {

      $scope.SearchPerformed = true;
      $scope.ServerSearch = $scope.ServerSearch.trim();

      var filterType = '';

      // Allow searching by IP or instance id
      if (IsIPv4($scope.ServerSearch)) {
        filterType = 'private-ip-address';
      } else if ($scope.ServerSearch.startsWith('i-')) {
        filterType = 'instance-id';
      } else {
        $scope.ServerDetails = {};
        $scope.DataFound = false;
        return;
      }

      var params = {
        account: $scope.SelectedAccount,
        query: {},
      };
      params.query[filterType] = $scope.ServerSearch;

      awsService.instances.GetInstanceDetails(params).then(function (data) {
        $scope.ServerDetails = data[0] || {};
        $scope.DataFound = (data.length > 0);
      }, function (error) {

        $scope.ServerDetails = {};
        $scope.DataFound = false;
      });

    };

    function IsIPv4(value) {
      var match = value.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
      return match != null && match[1] <= 255 && match[2] <= 255 && match[3] <= 255 && match[4] <= 255;
    }

    init();
  });
