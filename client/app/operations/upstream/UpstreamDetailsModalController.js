/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.operations').controller('UpstreamDetailsModalController',
  function ($scope, $uibModalInstance, $q, awsService, accountMappingService, upstream) {
    $scope.Upstream = upstream;
    $scope.ServerData = [];
    $scope.DataLoading = true;

    function init() {
      // Get list of unique IPs being used by all Load Balancers in relation to this upstream (should be the same, but just in case)
      var uniqueIPs = GetUniqueIPs();
      var servers = [];

      getAWSData(uniqueIPs).then(function (data) {
        servers = data;

        // Check for IPs that don't have matching Instances in AWS - probably already removed by scaling or manual change
        if (data.length !== uniqueIPs.length) {
          var ipsNotFound = uniqueIPs.filter(function awsDataNotFound(ip) {
            return getAWSDataByIP(ip, data) === null;
          });

          ipsNotFound.forEach(function (ip) {
            servers.push({ Ip: ip });
          });
        }

        // Merge in NGINX status info
        servers.forEach(function (server) {
          server.LoadBalancerServerState = [];
          upstream.Value.LoadBalancerState.LBs.forEach(function (lb) {
            var lbServerState = { Name: lb.Name, State: getLBServerState(server.Ip, lb) };
            server.LoadBalancerServerState.push(lbServerState);
          });
        });

        $scope.ServerData = servers;
        $scope.DataLoading = false;
      });
    }

    $scope.Ok = function () {
      $uibModalInstance.close();
    };

    // Get list of unique IPs being used by all Load Balancers in relation to this upstream (should all have the same, but might be slight variation during change events)
    function GetUniqueIPs() {
      var uniqueIPs = [];
      upstream.Value.LoadBalancerState.LBs.forEach(function (lb) {
        if (lb.ServerStatus) {
          lb.ServerStatus.forEach(function (serverState) {
            var ip = serverState.Server.split(':')[0]; // Truncate port
            if (uniqueIPs.indexOf(ip) === -1) {
              uniqueIPs.push(ip);
            }
          });
        }
      });

      // TODO: Add any missing IPs from the related ASG as well (to check for instances in AWS not yet in the LB)

      return uniqueIPs;
    }

    function getAWSData(uniqueIPs) {
      var deferred = $q.defer();
      accountMappingService.getAccountForEnvironment(upstream.Value.EnvironmentName).then(function (accountName) {
        if (uniqueIPs.length > 0) {
          var params = {
            account: accountName,
            query: {
              ip_address: []
            }
          };
          uniqueIPs.forEach(function (ip) {
            params.query.ip_address.push(ip);
          });

          awsService.instances.GetInstanceDetails(params).then(function (data) {
            deferred.resolve(data);
          });
        } else {
          deferred.resolve([]);
        }
      });

      return deferred.promise;
    }

    function getAWSDataByIP(ip, data) {
      for (var i = 0; i < data.length; i++) {
        if (data[i].Ip === ip) {
          return data[i];
        }
      }

      return null;
    }

    function getLBServerState(ip, lb) {
      for (var i = 0; i < lb.ServerStatus.length; i++) {
        if (lb.ServerStatus[i].Server) {
          var serverIp = lb.ServerStatus[i].Server.split(':')[0]; // remove port
          if (serverIp === ip) {
            return lb.ServerStatus[i].State;
          }
        }
      }

      return 'unknown';
    }

    init();
  });

