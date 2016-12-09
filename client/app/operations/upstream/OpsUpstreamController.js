/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').controller('OpsUpstreamController',
  function ($routeParams, $location, $uibModal, $q, $http, resources, QuerySync, cachedResources, accountMappingService, modal) {
    var vm = this;
    var querySync;
    var SHOW_ALL_OPTION = 'Any';

    vm.environmentsList = [];
    vm.owningClustersList = [];
    vm.statesList = ['All', 'Up', 'Down'];
    vm.servicesData = [];

    vm.fullUpstreamData = [];
    vm.data = [];
    vm.dataFound = false;
    vm.dataLoading = false;

    function init() {
      $q.all([
        cachedResources.config.environments.all().then(function (environments) {
          vm.environmentsList = _.map(environments, 'EnvironmentName').sort(function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
          });

          querySync = new QuerySync(vm, {
            environment: {
              property: 'selectedEnvironment',
              default: vm.environmentsList[0],
            },
            cluster: {
              property: 'selectedOwningCluster',
              default: SHOW_ALL_OPTION,
            },
            state: {
              property: 'selectedState',
              default: 'Up',
            },
            service: {
              property: 'selectedService',
              default: '',
            }
          });

          querySync.init();
        }),

        cachedResources.config.services.all().then(function (services) {
          vm.servicesData = services;
        }),

        cachedResources.config.clusters.all().then(function (clusters) {
          vm.owningClustersList = [SHOW_ALL_OPTION].concat(_.map(clusters, 'ClusterName')).sort();
        }),
      ]).then(function () {
        vm.refresh();
      });
    }

    vm.refresh = function () {
      vm.dataLoading = true;
      var params = { account: 'all' };
      resources.config.lbUpstream.all(params).then(function (data) {
        vm.fullUpstreamData = restructureUpstreams(data);
        return updateLBStatus().then(function(){
          vm.updateFilter();
          vm.dataFound = true;
        });
      }).finally(function () {
        vm.dataLoading = false;
      });
    };

    vm.updateFilter = function () {
      querySync.updateQuery();
      
      vm.data = vm.fullUpstreamData.filter(function (upstream) {
        var match = true;
        match = match && upstream.Value.EnvironmentName == vm.selectedEnvironment;

        if (vm.selectedService) {
          var serviceName = angular.lowercase(upstream.Value.ServiceName);
          var upstreamName = angular.lowercase(upstream.Value.UpstreamName);
          var serviceMatch = false;
          var upstreamMatch = false;
          if (!serviceName && !upstreamName) return false;
          if (serviceName) {
            serviceMatch = serviceName.indexOf(angular.lowercase(vm.selectedService)) != -1;
          }

          if (upstreamName) {
            upstreamMatch = upstreamName.indexOf(angular.lowercase(vm.selectedService)) != -1;
          }

          match = match && (serviceMatch || upstreamMatch);
        }

        if (vm.selectedState != 'All') {
          match = match && upstream.Value.State == angular.lowercase(vm.selectedState);
        }

        if (vm.selectedOwningCluster != SHOW_ALL_OPTION) {
          match = match && upstream.Value.OwningCluster == vm.selectedOwningCluster;
        }

        return match;
      });

      
    };

    vm.showInstanceDetails = function (upstreamData) {
      var instance = $uibModal.open({
        templateUrl: '/app/operations/upstream/ops-upstream-details-modal.html',
        controller: 'UpstreamDetailsModalController as vm',
        size: 'lg',
        windowClass: 'LBStatus',
        resolve: {
          upstream: function () {
            return upstreamData;
          },
        },
      });
    };

    vm.toggleService = function () {
      $uibModal.open({
        templateUrl: '/app/operations/ops-toggle-service-modal.html',
        controller: 'ToggleServiceModalController as vm',
        resolve: {
          environmentName: function () {
            return vm.selectedEnvironment;
          },
        },
      }).result.then(function (upstreamChanged) {
        if (!upstreamChanged) return;
        vm.refresh();
      });
    };

    vm.toggleUpstream = function (upstream) {
      var environmentName = upstream.Value.EnvironmentName;
      var upstreamName = upstream.Value.UpstreamName;

      modal.confirmation({
        title: 'Toggling Upstream',
        message: 'Are you sure you want to toggle upstream <strong>' + upstreamName + '</strong> in <strong>' + environmentName + '</strong>?',
        details: ['Note: In most cases it is better to use <b>Toggle Service</b> instead when doing Blue/Green cutovers as this performs additional validation and copes with multiple upstreams.'],
        action: 'Toggle Upstream',
      }).then(function () {
        $http({
          method: 'put',
          url: '/api/v1/upstreams/' + upstreamName + '/slices/toggle?environment=' + environmentName,
          data: {}
        }).then(function() {
          vm.refresh();
        });
      });
    };


    // Convert to flat hosts array. Match port numbers to Blue/Green slice for corresponding service. Add NGINX status
    function restructureUpstreams(upstreams) {

      var flattenedUpstreams = [];

      upstreams.forEach(function (upstream) {
        var service = getServiceForUpstream(upstream.Value.ServiceName);
        upstream.Value.Hosts.forEach(function (host) {
          var upstreamHost = angular.copy(upstream);
          delete upstreamHost.Value.Hosts;
          upstreamHost.Value.DnsName = host.DnsName;
          upstreamHost.Value.Port = host.Port;
          upstreamHost.Value.State = host.State;
          upstreamHost.Value.Slice = getSlice(host.Port, service);
          upstreamHost.Value.OwningCluster = service ? service.OwningCluster : 'Unknown';
          upstreamHost.Value.LoadBalancerState = { LBs: [] }; // Populated async later
          flattenedUpstreams.push(upstreamHost);
        });
      });

      return flattenedUpstreams;
    }

    // TODO: replace with getByName?
    function getServiceForUpstream(serviceName) {
      var foundService = null;
      if (serviceName) {
        vm.servicesData.forEach(function (service) {
          if (service.ServiceName.localeCompare(serviceName) == 0) {
            foundService = service;
            return;
          }
        });
      }

      return foundService;
    }

    function getSlice(port, service) {
      if (_.toInteger(_.get(service, 'Value.BluePort')) === port) return 'Blue';
      if (_.toInteger(_.get(service, 'Value.GreenPort')) === port) return 'Green';
      return 'Unknown';
    }

    function updateLBStatus() {

      // Read LBs for this environment
      return accountMappingService.getEnvironmentLoadBalancers(vm.selectedEnvironment).then(function (lbs) {

        // Clear existing data
        vm.fullUpstreamData.forEach(function (upstreamHost) {
          upstreamHost.Value.LoadBalancerState.LBs = [];
        });

        // Loop LBs and read LB status data
        var promises = lbs.map(function (lb) {
          var url = ['api', 'v1', 'load-balancer', lb].join('/');

          return $http.get(url).then(function (response) {
            var nginxData = response.data;
            var lbName = lb.split('.')[0]; // Drop .prod/nonprod.local from name

            // Loop upstream hosts and associate LB status with each record
            vm.fullUpstreamData.forEach(function (upstreamHost) {
              var lbServerStatusData = getLBStatusForUpstream(upstreamHost.Value.UpstreamName, upstreamHost.Value.Port, nginxData);
              var lbData = { Name: lbName, State: getActualUpstreamState(lbServerStatusData), ServerStatus: lbServerStatusData };

              upstreamHost.Value.LoadBalancerState.LBs = upstreamHost.Value.LoadBalancerState.LBs.filter(function (existingLbData) {
                return (existingLbData.Name != lbName);
              });

              upstreamHost.Value.LoadBalancerState.LBs.push(lbData);

              var allLbServerStatusData = _.flatten(upstreamHost.Value.LoadBalancerState.LBs.map(function(lb){ return lb.ServerStatus; }));
              upstreamHost.Value.LoadBalancerState.State = getActualUpstreamState(allLbServerStatusData);
            });

          });
        });
        
        return $q.all(promises);
      });
    }

    function getLBStatusForUpstream(upstreamName, upstreamPort, LBData) {
      var match = null;
      LBData.forEach(function (lbUpstream) {
        if (lbUpstream.name == upstreamName) {

          if (lbUpstream.hosts) {
            // Filter to only the ports for this slice
            match = lbUpstream.hosts.filter(function (host) {
              var port = host.server.split(':')[1];
              return port == upstreamPort;
            });
          }

          return;
        }
      });

      return match;
    }

    function getActualUpstreamState(lbServerStatusData) {
      var upCount = 0;
      var downCount = 0;
      var unhealthyCount = 0;
      var state = 'Empty';

      if (lbServerStatusData && lbServerStatusData.length > 0) {
        lbServerStatusData.forEach(function (server) {
          if (server) {
            if (server.state == 'up') { upCount++; }
            if (server.state == 'down') { downCount++; }
            if (server.state == 'unhealthy') { unhealthyCount++; }
          }
        });

        if (upCount == lbServerStatusData.length) {
          state = 'Up';
        } else if (downCount == lbServerStatusData.length) {
          state = 'Down';
        } else if (unhealthyCount == lbServerStatusData.length) {
          state = 'Unhealthy';
        } else if (upCount > 0 && unhealthyCount > 0 && downCount == 0) {
          state = 'UpUnhealthy';
        } else if ((upCount > 0 || unhealthyCount > 0) && downCount > 0) {
          // Should never get some up/unhealth AND some down
          state = 'ConfigError';
        }
      }

      var upstreamState = {
        UpCount: upCount,
        DownCount: downCount,
        UnhealthyCount: unhealthyCount,
        Overall: state,
      };

      return upstreamState;
    }

    init();
  });
