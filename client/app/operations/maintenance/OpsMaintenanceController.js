/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.operations').controller('OpsMaintenanceController',
  function ($scope, $http, $routeParams, $location, $uibModal, $q, resources, cachedResources, modal, awsService, instancesService) {
    var vm = this;

    var RECORD_KEY = 'MAINTENANCE_MODE';
    var SHOW_ALL_OPTION = 'All';
    var IP_LIST_TYPE = {
      InMaintenance: 'InMaintenance',
      NotFound: 'NotFound'
    };

    vm.accountIPList = []; // [{ AccountName, Ip }]
    vm.data = [];
    vm.IPsNotFound = [];
    vm.accountsList = [];
    vm.selectedAccount = SHOW_ALL_OPTION;
    vm.dataLoading = false;

    function init() {
      cachedResources.config.accounts.all().then(function (accounts) {
        accounts = _.map(accounts, 'AccountName');
        vm.accountsList = [SHOW_ALL_OPTION].concat(accounts).sort();
      }).then(function () {
        vm.refresh();
      });
    }

    vm.refresh = function () {
      vm.accountIPList = [];
      vm.data = [];
      vm.IPsNotFound = [];
      vm.dataLoading = true;

      var readAccountPromises;
      // Read all or just selected account
      if (vm.selectedAccount == SHOW_ALL_OPTION) {
        readAccountPromises = vm.accountsList.map(ProcessMaintenanceIpsByAccount);
      } else {
        readAccountPromises = [ProcessMaintenanceIpsByAccount(vm.selectedAccount)];
      }

      $q.all(readAccountPromises).then(function (data) {
        data = _.flatten(data);
        vm.data = data;
      }).finally(function () {
        vm.dataLoading = false;
      });
    };

    vm.removeNotFound = function () {
      modal.confirmation({
        title: 'Remove Out of Date Records',
        message: 'This will remove the selected out of date records.',
        action: 'Confirm',
        severity: 'Info'
      }).then(function () {
        removingIPsFromMaintenance(IP_LIST_TYPE.NotFound);
      });
    };

    vm.remove = function () {
      modal.confirmation({
        title: 'Put Selected Servers Back in Service',
        message: 'Are you sure you want to bring the selected servers back into service?',
        action: 'Confirm',
        severity: 'Warning',
        details: ['Note: This action may take up to 5 minutes to take effect in DNS']
      }).then(function () {
        removingIPsFromMaintenance(IP_LIST_TYPE.InMaintenance);
      });
    };

    vm.add = function () {
      var instance = $uibModal.open({
        templateUrl: '/app/operations/maintenance/ops-maintenance-addserver-modal.html',
        controller: 'MaintenanceAddServerModalController as vm',
        resolve: {
          defaultAccount: function () {
            return vm.selectedAccount;
          }
        }
      }).result.then(function () {
        vm.refresh();
      });
    };

    vm.numberOfItemsSelected = function () {
      var count = 0;
      for (var i = 0; i < vm.data.length; i++) {
        if (vm.data[i].Selected) { count++; }
      }

      return count;
    };

    vm.numberOfNotFoundItemsSelected = function () {
      var count = 0;
      for (var i = 0; i < vm.IPsNotFound.length; i++) {
        if (vm.IPsNotFound[i].Selected) { count++; }
      }

      return count;
    };

    function ProcessMaintenanceIpsByAccount(account) {
      if (account == SHOW_ALL_OPTION) return $q.when([]);

      var params = {
        account: account,
        key: RECORD_KEY
      };
      return $http.get('/api/v1/instances', { params: { maintenance: true } }).then(function (response) {
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
          vm.accountIPList.push(ip);
        });

        return _.map(data, function (instance) {
          return awsService.instances.getSummaryFromInstance(instance, vm.selectedAccount);
        });
      });
    }

    function getTasksForRemovingInstancesFromMaintenance(account, ipListTypeToManage) {
      var exitMaintenanceList = []; // IP list to remove from "MAINTENANCE_MODE" record in AsgIps DynamoDB table
      var asgForWhichPutInstancesInService = {}; // AutoScalingGroup for which move instances from Standby to InService

      function isItemBelongingToAccount(item, account) {
        return !item.AccountName || item.AccountName === account;
      }

      vm.data.forEach(function (item) {
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

      vm.IPsNotFound.forEach(function (item) {
        // Item must belong to the target AWS account
        if (!isItemBelongingToAccount(item, account)) return;

        if (ipListTypeToManage === IP_LIST_TYPE.NotFound && item.Selected) {
          // Adding to list of instances removed from maintenance
          exitMaintenanceList.push(item);
        }
      });

      var tasks = [];

      exitMaintenanceList.forEach(function (instance) {
        var task = instancesService.setMaintenanceMode(account, instance.InstanceId, false);
        tasks.push(task);
      });

      return tasks;
    }

    function removingIPsFromMaintenance(ipListTypeToManage) {
      var tasks = [];
      var accounts = vm.selectedAccount === SHOW_ALL_OPTION ? vm.accountsList : [vm.selectedAccount];

      accounts.forEach(function (account) {
        tasks = tasks.concat(getTasksForRemovingInstancesFromMaintenance(account, ipListTypeToManage));
      });

      $q.all(tasks).then(function () {
        vm.refresh();
      });
    }

    init();
  });
