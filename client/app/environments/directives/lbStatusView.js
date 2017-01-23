/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .directive('lbStatusView', function () {
    return {
      restrict: 'E',
      scope: {
        data: '<'
      },
      templateUrl: '/app/environments/directives/lbStatusView.html',
      controller: function ($scope, $rootScope, $attrs) {

        $scope.$watch('data', function(data) {
          $scope.vm = {
            lbs: toLbViewModels(data.lbs),
            instances: toInstanceViewModels(data.instances, data.lbs, data.upstreams)
          }
        }, true);

        function toLbViewModels(lbs) {
          if (lbs) {
            return lbs.map(function(lb){ return lb.name; });
          }
        }

        function toInstanceViewModels(instances, lbs, upstreams) {
          if (instances) {
            return instances.map(function(instance){
              var hosts = getHosts(instance, lbs, upstreams);
              return {
                ip: instance.PrivateIpAddress,
                name: instance.Name,
                instanceId: instance.InstanceId,
                hosts: hosts
              }
            });
          }
        }

        function getHosts(instance, lbs, upstreams) {
          var hosts = getHostsForInstance(instance, lbs);
          return toViewableHosts(hosts, upstreams);
        }

        function getHostsForInstance(instance, lbs) {
          var hosts = [];

          lbs.forEach(function(lb) {
            lb.upstreams.forEach(function(upstream){
              upstream.Hosts.forEach(function(host) {
                var ipAndPort = host.Server.split(':');
                if (instance.PrivateIpAddress === ipAndPort[0]) {
                  hosts.push({ LB: lb.name, Upstream: upstream.Name, Port: ipAndPort[1], State: host.State})
                }
              })
            });
          });

          return hosts;
        }

        function toViewableHosts(hosts, upstreams) {
          var groupedHosts = _.groupBy(hosts, function(host){ return host.Upstream + host.Port; });
          return mapPropertyValues(groupedHosts, function(hostsInGroup) {

            var firstHostInGroup = _.head(hostsInGroup);
            var upstreamName = firstHostInGroup.Upstream;
            var port = firstHostInGroup.Port;

            var upstreamConfig = _.find(upstreams, function(upstream){ return upstream.Value.UpstreamName === upstreamName; });

            var serviceName, slice, configuredState;
            if (upstreamConfig) {
              serviceName = upstreamConfig.Value.ServiceName;
              var host = _.find(upstreamConfig.Value.Hosts, function(host) { return host.Port == port; });

              if (host) {
                configuredState = host.State;
                var colour = _.last(host.DnsName.split('-'));
                slice = colour || 'unknown';
              }
            }

            return {
              upstream: upstreamName,
              service: serviceName,
              state: configuredState,
              slice: slice,
              port: port,
              hosts: _.keyBy(hostsInGroup, function(item) { return item.LB; })
            }

          });
        }

        function mapPropertyValues(o, fn) {
          return _.keys(o).map(function(key) {
            return fn(o[key]);
          });
        };

      }
    };
  });