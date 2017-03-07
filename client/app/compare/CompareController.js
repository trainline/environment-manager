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
    vm.states = [SHOW_ALL_OPTION].concat(['ACTIVE']);
    vm.selected.state = SHOW_ALL_OPTION;
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
      var state = $location.search().state || SHOW_ALL_OPTION;

      vm.selected.cluster = cluster;
      vm.selected.state = state;
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
      return addUpstreamsData(data)
        .then(markAllItemsAsComparableByDefault)
        .then(bringUpstreamNameToTopLevel)
        .then(markItemsWithTooManyUpstreams)
        .then(addUpstreamsSlicesData)
        .then(markItemsWithMoreThanOneActiveSliceData)
        .then(setStateOfDataWithDeploymentsMatchingSliceData)
        .then(markItemsWithNoStateButMultipleDeployments)
        .then(function (final) {
          return final;
        });
    }

    function markAllItemsAsComparableByDefault(data) {
      data.forEach(function (d) {
        d.Comparable = true;
      });

      return data;
    }

    function addUpstreamsData(data) {
      return upstreamService.get()
        .then(function (upstreams) {
          return matchDataToUpstreams(data, upstreams);
        })
        .then(function () {
          return data;
        });
    }

    function matchDataToUpstreams(data, upstreams) {
      return data.map(function (d) {
        if (upstreams.data) {
          upstreams.data.forEach(function (u) {
            if (dataMatchesUpstream(d, u)) {
              createDefaultUpstreamsOnData(d).Upstreams.push(u);
            }
          });
        }
        return d;
      });
    }

    function bringUpstreamNameToTopLevel(data) {
      return data.map(function (d) {
        if (d.Upstreams && d.Upstreams[0] && d.Upstreams[0].Value) {
          d.UpstreamName = d.Upstreams[0].Value.UpstreamName;
        }
        return d;
      });
    }

    function dataMatchesUpstream(d, u) {
      return d.EnvironmentName === u.Value.EnvironmentName && d.key === u.Value.ServiceName;
    }

    function createDefaultUpstreamsOnData(d) {
      d.Upstreams = d.Upstreams || [];
      return d;
    }

    function markItemsWithTooManyUpstreams(data) {
      return data.map(function (d) {
        if (d.Upstreams && d.Upstreams.length > 1) {
          d.Comparable = false;
        }
        return d;
      });
    }

    function addUpstreamsSlicesData(data) {
      var comparableData = getComparableData(data);

      return $q.all(createListOfSliceDataRequests(comparableData))
        .then(function (slices) {
          slices.forEach(function (s) {
            s.data.forEach(function (sData) {
              var upstreamName = sData.UpstreamName;
              comparableData.forEach(function (d) {
                if (d.UpstreamName === upstreamName) {
                  d.UpstreamsSliceData = d.UpstreamsSliceData || [];
                  d.UpstreamsSliceData.push(sData);
                }
              });
            });
          });
          return data;
        });
    }

    function markItemsWithMoreThanOneActiveSliceData(data) {
      data.forEach(function (d) {
        var sliceData;
        if (d.UpstreamsSliceData) {
          sliceData = d.UpstreamsSliceData.filter(function (sData) {
            if (sData.State) {
              return sData.State.toUpperCase() === 'ACTIVE';
            }
            return false;
          });
        }
        if (sliceData && sliceData.length > 1) {
          d.Comparable = false;
        }
      });

      return data;
    }

    function setStateOfDataWithDeploymentsMatchingSliceData(data) {
      getComparableData(data).forEach(function (d) {
        if (d.deployments && d.UpstreamsSliceData) {
          d.deployments.forEach(function (deployment) {
            d.UpstreamsSliceData.forEach(function (sData) {
              if (sData.Name.toUpperCase() === deployment.slice.toUpperCase()) {
                deployment.State = sData.State;
              }
            });
          });
        }
      });

      return data;
    }

    function markItemsWithNoStateButMultipleDeployments(data) {
      getComparableData(data).forEach(function (d) {
        if (d.deployments && d.deployments.length > 1) {
          var hasState = false;
          d.deployments.forEach(function (deployment) {
            if (deployment.State) {
              hasState = true;
            }
          });

          if (!hasState) {
            d.Comparable = false;
          }
        }
      });

      return data;
    }

    function createListOfSliceDataRequests(data) {
      var promises = [];
      var upstreams = [];

      data.forEach(function (d) {
        if (d.Upstreams) {
          upstreams.push(d.Upstreams[0].Value.UpstreamName);
          promises.push(upstreamService.getSlice(getUpstreamName(d), d.EnvironmentName));
        }
      });

      return promises;
    }

    function getComparableData(data) {
      return data.filter(function (d) {
        return d.Comparable;
      });
    }

    function getUpstreamName(d) {
      return d.Upstreams[0].Value.UpstreamName;
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
      _.remove(vm.selected.environments, vm.selected.primaryEnvironment, vm.selected.state);

      var url = 'res=' + vm.selected.comparable.key;
      if (vm.selected.primaryEnvironment) url += '&compare=' + vm.selected.primaryEnvironment.EnvironmentName;
      if (vm.selected.state) url += '&state=' + vm.selected.state;
      if (vm.selected.environments) url += '&to=' + _.join(vm.selected.environments.map(function (env) { return env.EnvironmentName; }), ',');
      url += '&cluster=' + vm.selected.cluster;

      $location.search(url);
    };

    function markItemsAsUncomparable(data, on) {
      data.forEach(function (d) {
        if (d.primary) {
          d.primary.Active = on;
        }

        if (d.comparisons) {
          Object.keys(d.comparisons).forEach(function (key) {
            if (d.comparisons[key]) {
              d.comparisons[key].Active = on;
            }
          });
        }
      });
    }

    function updateView(data) {
      var primaryEnvironment = vm.selected.primaryEnvironment.EnvironmentName;
      var secondaryEnvironments = _.map(vm.selected.environments, 'EnvironmentName');
      var filterCluster = vm.selected.cluster === SHOW_ALL_OPTION ? null : vm.selected.cluster;

      if (vm.selected.comparable.key === 'versions') {
        vm.view = serviceComparison(data, primaryEnvironment, secondaryEnvironments);

        if (vm.selected.state.toUpperCase() === 'ACTIVE') {
          markItemsAsUncomparable(vm.view.items, true);
        } else {
          markItemsAsUncomparable(vm.view.items, false);
        }

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

