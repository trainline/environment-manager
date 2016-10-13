/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').controller('OpsMaintenanceController',
  function ($scope, $http, $routeParams, $location, $uibModal, $q, resources, cachedResources, modal, awsService, instancesService) {

    var RECORD_KEY = 'MAINTENANCE_MODE';
    var SHOW_ALL_OPTION = 'All';
    var IP_LIST_TYPE = {
      InMaintenance: 'InMaintenance',
      NotFound: 'NotFound',
    };

    $scope.AccountIPList = []; // [{ AccountName, Ip }]
    $scope.Data = [];
    $scope.IPsNotFound = [];
    $scope.AccountsList = [];
    $scope.SelectedAccount = SHOW_ALL_OPTION;
    $scope.DataLoading = false;

    function init() {
      cachedResources.config.accounts.all().then(function (accounts) {
        accounts = _.map(accounts, 'AccountName');
        $scope.AccountsList = [SHOW_ALL_OPTION].concat(accounts).sort();
      }).then(function () {
        $scope.Refresh();
      });
    };

    $scope.Refresh = function () {

      $scope.AccountIPList = [];
      $scope.Data = [];
      $scope.IPsNotFound = [];
      $scope.DataLoading = true;

      var readAccountPromises;
      // Read all or just selected account
      if ($scope.SelectedAccount == SHOW_ALL_OPTION) {
        readAccountPromises = $scope.AccountsList.map(ProcessMaintenanceIpsByAccount);
      } else {
        readAccountPromises = [ProcessMaintenanceIpsByAccount($scope.SelectedAccount)];
      }

      $q.all(readAccountPromises).then(function (data) {
        data = _.flatten(data);
        $scope.Data = data;
      }).finally(function () {
        $scope.DataLoading = false;
      });
    };

    $scope.RemoveNotFound = function () {
      modal.confirmation({
        title: 'Remove Out of Date Records',
        message: 'This will remove the selected out of date records.',
        action: 'Confirm',
        severity: 'Info',
      }).then(function () {
        removingIPsFromMaintenance(IP_LIST_TYPE.NotFound);
      });
    };

    $scope.Remove = function () {
      modal.confirmation({
        title: 'Put Selected Servers Back in Service',
        message: 'Are you sure you want to bring the selected servers back into service?',
        action: 'Confirm',
        severity: 'Warning',
        details: ['Note: This action may take up to 5 minutes to take effect in DNS'],
      }).then(function () {
        removingIPsFromMaintenance(IP_LIST_TYPE.InMaintenance);
      });
    };

    $scope.Add = function () {
      var instance = $uibModal.open({
        templateUrl: '/app/operations/maintenance/ops-maintenance-addserver-modal.html',
        controller: 'MaintenanceAddServerModalController as vm',
        resolve: {
          defaultAccount: function () {
            return $scope.SelectedAccount;
          },
        },
      }).result.then(function () {
        $scope.Refresh();
      });
    };

    $scope.NumberOfItemsSelected = function () {
      var count = 0;
      for (var i = 0; i < $scope.Data.length; i++) {
        if ($scope.Data[i].Selected) { count++; }
      }

      return count;
    };

    $scope.NumberOfNotFoundItemsSelected = function () {
      var count = 0;
      for (var i = 0; i < $scope.IPsNotFound.length; i++) {
        if ($scope.IPsNotFound[i].Selected) { count++; }
      }

      return count;
    };

    function ProcessMaintenanceIpsByAccount(account) {

      if (account == SHOW_ALL_OPTION) return $q.when([]);

      var params = {
        account: account,
        key: RECORD_KEY,
      };
      return $http.get('/api/v1/instances', { params: { maintenance: true }}).then(function (response) {
        var data = response.data;

        var ipList = [];

        // Read list of IPs under Maintenance and add account info
        if (data.length > 0) {
          ipList = _.map(data, function (instance) {
            return { AccountName: account, Ip: instance.PrivateIpAddress };
          });
        }

        // Append to $scope variable
        ipList.forEach(function (ip) {
          $scope.AccountIPList.push(ip);
        });

        return _.map(data, function (instance) {
          return awsService.instances.getSummaryFromInstance(instance, $scope.SelectedAccount);
        });

      });
    }

    function getTasksForRemovingInstancesFromMaintenance(account, ipListTypeToManage) {

      var exitMaintenanceList = []; // IP list to remove from "MAINTENANCE_MODE" record in AsgIps DynamoDB table
      var asgForWhichPutInstancesInService = {}; // AutoScalingGroup for which move instances from Standby to InService

      function isItemBelongingToAccount(item, account) {
        return !item.AccountName || item.AccountName === account;
      }

      $scope.Data.forEach(function (item) {

        // Item must belong to the target AWS account
        if (!isItemBelongingToAccount(item, account)) return;

        if (ipListTypeToManage === IP_LIST_TYPE.InMaintenance && item.Selected) {

          // Adding to list of instances removed from maintenance
          exitMaintenanceList.push(item);

          // Instances which belong to an AutoScalingGroup also need to be exited from Standby and put InService
          var groupName = item['aws:autoscaling:groupName'];
          if (groupName) {
            asgForWhichPutInstancesInService[groupName] = asgForWhichPutInstancesInService[groupName] || [];
            asgForWhichPutInstancesInService[groupName].push(item.InstanceId);
          }
        }
      });

      $scope.IPsNotFound.forEach(function (item) {

        // Item must belong to the target AWS account
        if (!isItemBelongingToAccount(item, account)) return;

        if (ipListTypeToManage === IP_LIST_TYPE.NotFound && item.Selected) {

          // Adding to list of instances removed from maintenance
          exitMaintenanceList.push(item);
        }
      });

      var tasks = [];

      exitMaintenanceList.forEach(function(instance) {
        var task = instancesService.setMaintenanceMode(account, instance.InstanceId, false);
        tasks.push(task);
      });

      return tasks;
    }

    function removingIPsFromMaintenance(ipListTypeToManage) {

      var tasks = [];
      var accounts = $scope.SelectedAccount === SHOW_ALL_OPTION ? $scope.AccountsList : [$scope.SelectedAccount];

      accounts.forEach(function (account) {
        tasks = tasks.concat(getTasksForRemovingInstancesFromMaintenance(account, ipListTypeToManage));
      });

      $q.all(tasks).then(function () {
        $scope.Refresh();
      });
    }

    init();

  });
