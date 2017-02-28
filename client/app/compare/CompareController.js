/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.compare').controller('CompareController',
  function ($scope, $routeParams, serviceComparison, $location, $q, $uibModal,
    resources, cachedResources, comparableResources, ResourceComparison, $log, upstreamService) {
    var vm = this;
    var SHOW_ALL_OPTION = 'Any';
    var services;

    vm.environments = [];
    vm.selected = {};
    vm.dataLoading = false;

    function init() {
      vm.comparableResources = comparableResources;
      vm.selected.comparable = getVersionsComparableResource();


      $q.all([
        cachedResources.config.clusters.all().then(function (clusters) {
          vm.clustersList = [SHOW_ALL_OPTION].concat(_.map(clusters, 'ClusterName')).sort();
        }),
        resources.config.environments.all().then(function (environments) {
          vm.environments = _.sortBy(environments, 'EnvironmentName');
          vm.selected.primaryEnvironment = vm.environments[0];
        }),
        resources.config.services.all().then(function (s) {
          services = s;
        })
      ]).then(function () {
        setStateFromUrl();
      });
    }

    function getVersionsComparableResource() {
      return vm.comparableResources[0];
    }

    $scope.$on('$locationChangeSuccess', function () {
      setStateFromUrl();
    });

    function setStateFromUrl() {
      var res = $location.search().res || getVersionsComparableResource().key;
      var compare = $location.search().compare || vm.environments[0].EnvironmentName;
      var to = $location.search().to || '';
      var cluster = $location.search().cluster || SHOW_ALL_OPTION;

      vm.selected.cluster = cluster;
      vm.selected.comparable = _.find(vm.comparableResources, { key: res });

      if (vm.environments && vm.environments.length > 0) {
        vm.selected.primaryEnvironment = _.find(vm.environments, { EnvironmentName: compare });

        var searchEnvs = to.split(',');
        var foundEnvs = _.filter(vm.environments, function (env) {
          return _.includes(searchEnvs, env.EnvironmentName);
        });

        vm.selected.environments = foundEnvs;
      }

      vm.view = null;
      if (vm.selected.environments && vm.selected.environments.length > 0) {
        vm.dataLoading = true;
        var allEnvironments = _.union([vm.selected.primaryEnvironment], vm.selected.environments);
        vm.selected.comparable.get(allEnvironments)
          .then(setComparableData)
          .then(updateView)
          .finally(function () {
            vm.dataLoading = false;
          });
      }
    }

    function setComparableData(data) {
      return addUpstreamData(data)
        .then(findActiveSlice)
        .then(function (final) {
          console.log(final);
          return final;
        });
    }

    function addUpstreamData(data) {
      return upstreamService.get()
        .then(function (upstreams) {
          return data.map(function (d) {
            upstreams.data.forEach(function (u) {
              d.Upstreams = d.Upstreams || [];
              if (d.EnvironmentName === u.Value.EnvironmentName && d.key === u.Value.ServiceName) {
                d.Upstreams.push(u);
              }
              if (d.Upstreams.length === 1) {
                d.Comparable = true;
              } else {
                d.Comparable = false;
              }
            });
            return d;
          });
        });
    }

    function findActiveSlice(data) {
      var promises = [];
      data.filter(function (d) {
        return d.Comparable;
      }).forEach(function (d) {
        promises.push(upstreamService.getSlice(d.Upstreams[0].Value.UpstreamName, d.EnvironmentName));
      });
      return $q.all(promises)
        .then(function (slices) {
          slices.filter(function (s) {
            return s.data.filter(function (sliceData) {
              return sliceData.State.toUpperCase() === 'ACTIVE';
            }).length === 1;
          }).filter(function (s) {
            return s.data.filter(function (sliceData) {
              return sliceData.State.toUpperCase() === 'ACTIVE';
            });
          }).forEach(function (s) {
            s.data.forEach(function (sliceData) {
              data.forEach(function (d) {
                console.log(sliceData)
                if (Array.isArray(d.deployments) && d.deployments.length > 0) {
                  console.log('data')
                  console.log(d)
                  d.deployments.forEach(function (deployment) {
                    console.log('deployment')
                    console.log(deployment)
                    if (deployment.slice.toUpperCase() === sliceData.Name.toUpperCase()) {
                      deployment.State = sliceData.State;
                    }
                  });
                }
              });
            });
          });

          return data;
        });
    }

    function setActiveState(comparableData) {
      var foundUpstreams = {};

      return activeStatusService.getAllUpstreamsData()
        .then(function (statusData) {
          comparableData.forEach(function (c) {
            var matches = statusData.data.filter(function (s) {
              return s.Value.EnvironmentName === c.EnvironmentName && s.Value.ServiceName === c.key;
            });

            if (matches.length > 0) {
              c.UpstreamName = matches[0].Value.UpstreamName;
              foundUpstreams[c.UpstreamName] = c;
            }
          });
        })
        .then(function getUpstreamActiveStatus() {
          var promises = [];
          comparableData.forEach(function (c) {
            if (c.UpstreamName) {
              promises.push(activeStatusService.getSliceInformation(c.UpstreamName, c.EnvironmentName));
            }
          });
          return $q.all(promises);
        })
        .then(function (stateResponses) {
          stateResponses.forEach(function (r) {
            r.data.forEach(function (d) {
              if (foundUpstreams[d.UpstreamName]) {
                foundUpstreams[d.UpstreamName].State = d.State;
              }
            });
          });
          return comparableData;
        });
    }

    vm.notPrimary = function () {
      return function (env) {
        return vm.selected.primaryEnvironment !== env;
      };
    };

    vm.showDiff = function (primary, secondary) {
      $uibModal.open({
        templateUrl: '/app/compare/diff-viewer/diff-viewer.html',
        controller: 'DiffViewerController',
        resolve: {
          primary: function () { return primary; },
          secondary: function () { return secondary; }
        }
      });
    };

    vm.onSelectionChanged = function () {
      _.remove(vm.selected.environments, vm.selected.primaryEnvironment);

      var url = 'res=' + vm.selected.comparable.key;
      if (vm.selected.primaryEnvironment) url += '&compare=' + vm.selected.primaryEnvironment.EnvironmentName;
      if (vm.selected.environments) url += '&to=' + _.join(vm.selected.environments.map(function (env) { return env.EnvironmentName; }), ',');
      url += '&cluster=' + vm.selected.cluster;

      $location.search(url);
    };

    function updateView(data) {
      var primaryEnvironment = vm.selected.primaryEnvironment.EnvironmentName;
      var secondaryEnvironments = _.map(vm.selected.environments, 'EnvironmentName');
      var filterCluster = vm.selected.cluster === SHOW_ALL_OPTION ? null : vm.selected.cluster;

      if (vm.selected.comparable.key === 'versions') {
        vm.view = serviceComparison(data, primaryEnvironment, secondaryEnvironments);
        if (filterCluster !== null) {
          vm.view.items = _.filter(vm.view.items, function (row) {
            var service = _.find(services, { ServiceName: row.key });
            if (service === undefined) {
              $log.warn('Service ' + row.key + ' not found!');
              return false;
            }
            return service.OwningCluster === filterCluster;
          });
        }
      } else {
        // generic object comparison
        vm.view = new ResourceComparison(data, primaryEnvironment, secondaryEnvironments);
      }
    }

    init();
  });

