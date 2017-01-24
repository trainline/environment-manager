/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments')
  .directive('lbStatusView', function () {
    return {
      restrict: 'E',
      scope: {
        data: '<'
      },
      templateUrl: '/app/environments/directives/lbStatusView.html',
      controller: function ($scope) {
        $scope.statesList = ['All', 'Up', 'Down'];
        $scope.selectedState = 'All';

        $scope.$watch('data', function () {
          $scope.updateView();
        }, true);

        $scope.updateView = function () {
          $scope.vm = {
            lbs: toLbViewModels($scope.data.lbs),
            instances: toInstanceViewModels($scope.data.instances, $scope.data.lbs, $scope.data.upstreams, $scope.selectedState)
          };
        };

        function toLbViewModels(lbs) {
          if (!lbs) { return null; }
          return lbs.map(function (lb) { return lb.name; });
        }

        function toInstanceViewModels(instances, lbs, upstreams, filterState) {
          if (!instances) { return null; }
          return instances.map(function (instance) {
            var hosts = getHosts(instance, lbs, upstreams, filterState);
            return {
              ip: instance.PrivateIpAddress,
              name: instance.Name,
              instanceId: instance.InstanceId,
              hosts: hosts
            };
          });
        }

        function getHosts(instance, lbs, upstreams, filterState) {
          var hosts = getHostsForInstance(instance, lbs);
          return toViewableHosts(hosts, upstreams).filter(function (host) {
            if (filterState === 'All') { return true; }
            return host.state === filterState.toLowerCase();
          });
        }

        function getHostsForInstance(instance, lbs) {
          var hosts = [];

          lbs.forEach(function (lb) {
            lb.upstreams.forEach(function (upstream) {
              upstream.Hosts.forEach(function (host) {
                var ipAndPort = host.Server.split(':');
                if (instance.PrivateIpAddress === ipAndPort[0]) {
                  hosts.push({ LB: lb.name, Upstream: upstream.Name, Port: ipAndPort[1], State: host.State });
                }
              });
            });
          });

          return hosts;
        }

        function toViewableHosts(hosts, upstreams) {
          var groupedHosts = _.groupBy(hosts, function (host) { return host.Upstream + host.Port; });
          return mapPropertyValues(groupedHosts, function (hostsInGroup) {
            var firstHostInGroup = _.head(hostsInGroup);
            var upstreamName = firstHostInGroup.Upstream;
            var port = firstHostInGroup.Port;

            var upstreamConfig = _.find(upstreams, function (upstream) { return upstream.Value.UpstreamName === upstreamName; });

            var serviceName;
            var slice;
            var configuredState;

            if (upstreamConfig) {
              serviceName = upstreamConfig.Value.ServiceName;
              var hostConfig = _.find(upstreamConfig.Value.Hosts, function (host) { return host.Port.toString() === port.toString(); });

              if (hostConfig) {
                configuredState = hostConfig.State;
                var colour = _.last(hostConfig.DnsName.split('-'));
                slice = (colour === 'green' || colour === 'blue') ? colour : 'unknown';
              }
            }

            return {
              upstream: upstreamName,
              service: serviceName,
              state: configuredState,
              slice: slice,
              port: port,
              hosts: _.keyBy(hostsInGroup, function (item) { return item.LB; })
            };
          });
        }

        function mapPropertyValues(o, fn) {
          return _.keys(o).map(function (key) {
            return fn(o[key]);
          });
        }
      }
    };
  });
