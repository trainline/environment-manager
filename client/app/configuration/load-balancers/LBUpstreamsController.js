/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

// Manage Load Balancer Upstreams
angular.module('EnvironmentManager.configuration').controller('LBUpstreamsController',
  function ($scope, $routeParams, $location, $q, modal, resources, UpstreamConfig, cachedResources, accountMappingService) {
    var vm = this;

    vm.environmentsList = [];
    vm.selectedEnvironment = '';
    vm.selectedService = '';

    vm.fullData = [];
    vm.data = [];
    vm.dataLoading = false;

    function init() {
      vm.canPost = user.hasPermission({ access: 'POST', resource: '/*/config/lbupstream/*' });

      $location.search('key', null);
      $location.search('mode', null);
      var env = $routeParams.up_environment;
      var serviceFilter = $routeParams.serviceFilter;

      if (serviceFilter) vm.selectedService = serviceFilter;

      $q.all([
        cachedResources.config.environments.all().then(function (environments) {
          vm.environmentsList = _.map(environments, 'EnvironmentName').sort();
        })
      ]).then(function () {
        vm.selectedEnvironment = env ? env : vm.environmentsList[0];
        vm.refresh();
      });
    }

    vm.canUser = function (action) {
      if (action == 'post') return vm.canPost;
      if (action == 'delete') return vm.canDelete;
    };

    vm.refresh = function () {
      $location.search('up_environment', vm.selectedEnvironment);
      vm.dataLoading = true;
      UpstreamConfig.getForEnvironment(vm.selectedEnvironment).then(function (data) {
        vm.fullData = data;
      }).finally(function () {
        vm.updateFilter();
        vm.dataLoading = false;
      });
    };

    vm.updateFilter = function () {
      $location.search('serviceFilter', vm.selectedService);
      vm.data = vm.fullData.filter(function (upstream) {
        var match = true;
        match = match && upstream.Value.EnvironmentName == vm.selectedEnvironment;
        var serviceName = angular.lowercase(upstream.Value.ServiceName);
        if (vm.selectedService) {
          if (!serviceName) return false;
          match = match && serviceName.indexOf(angular.lowercase(vm.selectedService)) != -1;
        }

        return match;
      });
    };

    vm.updateEnvironment = function () {
      vm.refresh();
    }

    vm.newItem = function () {
      $location.search('mode', 'New');
      $location.path('/config/upstream');
    };

    vm.edit = function (upstream) {
      $location.search('mode', 'Edit');
      $location.search('key', encodeURIComponent(upstream.key));
      $location.path('/config/upstream');
    };

    vm.copy = function (upstream) {
      $location.search('mode', 'Copy');
      $location.search('key', encodeURIComponent(upstream.key));
      $location.path('/config/upstream/');
    };

    vm.viewHistory = function (upstream) {
      $scope.ViewAuditHistory('LB Upstream', encodeURIComponent(upstream.key));
    };

    vm.markForDelete = function (upstreamData) {
      var upstream = new UpstreamConfig(upstreamData);
      console.log('Upstream ', upstream);
      upstream.markForDelete(upstream.key, (new Date()).getTime());
    }

    vm.delete = function (upstream) {
      var key = upstream.key;
      var name = upstream.Value.UpstreamName;
      var env = upstream.Value.EnvironmentName;
      var accountName = '';
      var lbSettings = [];

      accountMappingService.getAccountForEnvironment(vm.selectedEnvironment).then(function (acName) {
        accountName = acName;

        resources.config.lbSettings.all({ account: 'all' }).then(function (data) {
          lbSettings = data;
        }).then(function () {
          // Check whether upstream in use
          var inUseBy = lbSettings.filter(function (setting) {
            return UpstreamInUse(name, setting);
          });

          if (inUseBy.length > 0) {
            modal.information({
              title: 'Upstream in Use',
              message: 'Upstream <strong>' + name + '</strong> cannot be deleted because it is being referenced by the following Load Balancer settings:',
              details: _.map(inUseBy, 'VHostName').sort() // list of LBs that use it in this environment
            });
          } else {
            // Confirm
            modal.confirmation({
              title: 'Deleting a Load Balancer Upstream',
              message: 'Are you sure you want to delete the <strong>' + name + '</strong> Upstream from ' + env + '?',
              action: 'Delete',
              severity: 'Danger'
            }).then(function () {
              UpstreamConfig.markForDelete(key).then(function () {
                cachedResources.config.lbUpstream.flush();
                vm.refresh();
              });
            });
          }
        });
      });
    };

    function UpstreamInUse(upstreamName, lbSetting) {
      var inUse = false;
      lbSetting.Value.Locations.forEach(function (location) {
        if (location.ProxyPass) {
          var proxyUpstreamName = location.ProxyPass.replace('http://', '').replace('https://', '');
          if (proxyUpstreamName == upstreamName) {
            inUse = true;
          }
        }
      });

      return inUse;
    }

    init();
  });

