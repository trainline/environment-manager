/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').controller('OpsMaintenanceController',
  function ($scope, $routeParams, $location, $uibModal, $q, resources, cachedResources, modal, awsService, instancesService) {

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
      cachedResources.aws.accounts.all().then(function (accounts) {
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

      $q.all(readAccountPromises).then(function () {

        // Read EC2 meta data for selected IPs
        if ($scope.AccountIPList.length > 0) {
          var params = {
            account: $scope.SelectedAccount,
            query: {
              'private-ip-address': [],
            },
          };
          $scope.AccountIPList.forEach(function (accountIP) {
            params.query['private-ip-address'].push(accountIP.Ip);
          });

          awsService.instances.GetInstanceDetails(params).then(function (data) {
            $scope.Data = data;
            // Check for IPs that don't have matching Instances in AWS - probably already removed by scaling or manual change
            if ($scope.Data.length < $scope.AccountIPList.length) {
              $scope.IPsNotFound = $scope.AccountIPList.filter(function awsDataNotFound(accountIP) {
                var notFound = true;
                for (var i = 0; i < data.length; i++) {
                  if (data[i].Ip == accountIP.Ip) {
                    notFound = false;
                  }
                }

                return notFound;
              });
            }
          });
        }

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
        controller: 'MaintenanceAddServerModalController',
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

      if (account == SHOW_ALL_OPTION) return $q.when(true);

      var defer = $q.defer();
      var params = {
        account: account,
        key: RECORD_KEY,
      };
      resources.asgips.get(params).then(function (data) {

        var ipList = [];

        // Read list of IPs under Maintenance and add account info
        if (data.IPs && data.IPs.length > 0) {
          ipList = JSON.parse(data.IPs).map(function (ip) {
            return { AccountName: account, Ip: ip };
          });
        }

        // Append to $scope variable
        ipList.forEach(function (ip) {
          $scope.AccountIPList.push(ip);
        });

        defer.resolve(ipList);

      }, function (error) {

        // Record doesn't exist for this account, create empty placeholder
        console.log(RECORD_KEY + ' not found for ' + account + ' account, creating for first time use');
        var params = {
          account: account,
          key: RECORD_KEY,
          data: {
            IPs: JSON.stringify([]),
          },
        };
        resources.asgips.post(params).then(function (data) {
          defer.resolve();
        });

      });

      return defer.promise;
    }

    function getTasksForRemovingInstancesFromMaintenance(account, ipListTypeToManage) {

      var exitMaintenanceList = []; // IP list to remove from "MAINTENANCE_MODE" record in AsgIps DynamoDB table
      var stayInMaintenanceList = []; // IP list to maintain in "MAINTENANCE_MODE" record in AsgIps DynamoDB table
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
        } else {
          stayInMaintenanceList.push(item);
        }
      });

      $scope.IPsNotFound.forEach(function (item) {

        // Item must belong to the target AWS account
        if (!isItemBelongingToAccount(item, account)) return;

        if (ipListTypeToManage === IP_LIST_TYPE.NotFound && item.Selected) {

          // Adding to list of instances removed from maintenance
          exitMaintenanceList.push(item);
        } else {
          stayInMaintenanceList.push(item);
        }
      });

      // If no IP is to remove then no operations are needed
      if (!exitMaintenanceList.length) return [];

      var tasks = [];

      exitMaintenanceList.forEach(function(instance) {
        var task = instancesService.setMaintenanceMode(account, instance.InstanceId, false);
        tasks.push(task);
      });

      // Adding a task to updating "MAINTENANCE_MODE" record in AsgIps DynamoDB table
      tasks.push(resources.asgips.put({
        account: account,
        key: RECORD_KEY,
        data: {
          IPs: JSON.stringify(_.map(stayInMaintenanceList, 'Ip')),
        },
      }));

      // Adding a task for each AutoScalingGroup for which moving its instances from Standby to InService
      for (var groupName in asgForWhichPutInstancesInService) {
        var instanceIdsToPutInService = asgForWhichPutInstancesInService[groupName];

        tasks.push(resources.aws.asgs.exit(groupName)
          .instances(instanceIdsToPutInService)
          .fromStandby()
          .inAWSAccount(account)
          .do());
      }

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
