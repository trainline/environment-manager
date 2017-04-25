/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

angular.module('EnvironmentManager.configuration').controller('LBUpstreamController',
  function ($routeParams, $q, $location, cachedResources, modal, accountMappingService, UpstreamConfig, UpstreamViewModel) {
    var vm = this;

    var env = $routeParams.up_environment;
    var mode = $routeParams.mode ? $routeParams.mode : 'Edit';

    var isNewMode = mode === 'New';
    var isEditMode = mode === 'Edit';

    vm.view = new UpstreamViewModel({ mode: mode, user: window.user, environment: env });

    function init() {
      return $q.all([
        cachedResources.config.environments.all(),
        cachedResources.config.services.all(),
        fetchOrCreateUpstream()
      ]).then(function (results) {
        var data = { environments: results[0], services: results[1], upstream: results[2] };
        vm.upstream = data.upstream;
        vm.view.init(data);
      }).catch(function () {
        vm.backToSummary();
      });
    }

    vm.addHost = function () {
      if (!vm.view.newHostIsValid()) return;

      vm.upstream.Value.Hosts.push(angular.copy(vm.view.newHost));
      vm.view.clearNewHostEditor();
    };

    vm.deleteHost = function (selectedHost) {
      _.pull(vm.upstream.Value.Hosts, selectedHost);
    };

    vm.save = function () {
      if (!isEditMode && !_.startsWith(vm.upstream.Value.UpstreamName, vm.upstream.Value.EnvironmentName + '-')) {
        vm.view.showValidationError('Upstream Name must begin with the selected Environment and a dash');
        return;
      }

      var key = getUpstreamKey();

      confirmSaveIfNoActiveHosts().then(function () {
        return isEditMode ?
          vm.upstream.update(key) :
          vm.upstream.save(key);
      }).then(function () {
        cachedResources.config.lbUpstream.flush();
        vm.backToSummary(vm.upstream.Value.EnvironmentName);
      });
    };

    vm.backToSummary = function () {
      $location.path('/config/upstreams/');
      $location.search('up_environment', env);
    };

    function confirmSaveIfNoActiveHosts() {
      if (countActiveHosts() > 0) return Promise.resolve();

      return modal.confirmation({
        title: 'No Active Upstream Hosts',
        message: 'Are you sure you want to save this upstream with no active hosts?',
        action: 'Save'
      });
    }

    function getUpstreamKey() {
      if (isEditMode) return vm.upstream.key;
      return '/' + vm.upstream.Value.EnvironmentName + '_' + vm.upstream.Value.UpstreamName + '/config';
    }

    function fetchOrCreateUpstream() {
      if (isNewMode) return Promise.resolve(UpstreamConfig.createWithDefaults(env));

      return accountMappingService.getAccountForEnvironment(env).then(function (accountName) {
        return UpstreamConfig.getByKey(decodeURIComponent($routeParams.key), accountName);
      });
    }

    function countActiveHosts() {
      return _.filter(vm.upstream.Value.Hosts, { State: 'up' }).length;
    }

    init();
  });
