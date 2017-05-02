/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.configuration').factory('UpstreamViewModel', function () {
  var defaultHostTemplate = { DnsName: '', Port: null, FailTimeout: '30s', MaxFails: null, State: 'down', Weight: 1 };

  function UpstreamViewModel(params) {
    var self = this;

    var isNewMode = params.mode === 'New';
    var isCopyMode = params.mode === 'Copy';
    var isEditMode = params.mode === 'Edit';
    var allServices = [];
    var upstream;

    self.title = 'Loading...';
    self.showForm = false;
    self.showNameField = !isEditMode;

    self.configFieldsEnabled = false;
    self.configFieldsDisabled = true;

    self.showEnvironmentEditorField = isCopyMode;
    self.showEnvironmentReadOnlyField = !isCopyMode;
    self.showEnvironmentField = !isEditMode;

    if (isNewMode) {
      self.newHost = _.clone(defaultHostTemplate);
    }

    self.init = function (resources) {
      loadEnvironments(resources.environments);
      loadServices(resources.services);
      loadUpstream(resources.upstream);

      if (isNewMode) self.title = 'New Upstream';
      if (isCopyMode) self.title = 'Copy Upstream: ' + upstream.Value.UpstreamName;
      if (isEditMode) self.title = 'Edit Upstream: ' + upstream.Value.UpstreamName;

      var upstreamResourceName = '/config/upstreams/' + (isNewMode ? '*' : upstream.Value.UpstreamName);
      var hasPermissionsToEdit = params.user.hasPermission({
        access: 'PUT',
        resource: upstreamResourceName
      });

      self.configFieldsEnabled = hasPermissionsToEdit;
      self.configFieldsDisabled = !self.configFieldsEnabled;

      self.showForm = true;
    };

    self.errorOnInit = function (error) {
      self.showError = true;
      self.errorMessage = error;
    };

    self.showEnvironment

    self.showCreateHostLink = function () {
      return !self.newHost && self.configFieldsEnabled;
    };

    self.createNewHost = function () {
      if (!self.newHost) self.newHost = _.clone(defaultHostTemplate);
    };

    self.clearNewHostEditor = function () {
      delete self.newHost;
    };

    self.newHostIsValid = function () {
      return !!(self.newHost.DnsName && self.newHost.Port && self.newHost.Weight);
    };

    self.showServiceLink = function () {
      if (!upstream) return false;
      return !!getServiceByName(upstream.Value.ServiceName);
    };

    self.serviceLink = function () {
      if (!upstream) return null;

      var service = getServiceByName(upstream.Value.ServiceName);
      if (!service) return null;

      return '/#/config/services/' + service.ServiceName + '/?Range=' + service.OwningCluster;
    };

    self.toggleActiveHostsButtonIsDisabled = function () {
      return upstream.Value.Hosts.length === 0;
    };

    self.toggleActiveHosts = function () {
      upstream.Value.Hosts.forEach(function (host) {
        host.State = host.State === 'up' ? 'down' : 'up';
      });
    };

    self.showValidationError = function (msg) {
      self.validationError = msg;
    };

    function getServiceByName(serviceName) {
      return _.find(allServices, function (s) {
        return s.ServiceName === serviceName;
      });
    }

    function loadEnvironments(environments) {
      self.environments = _.map(environments, 'EnvironmentName').sort();
    }

    function loadServices(services) {
      allServices = services;
      self.services = _.map(services, 'ServiceName').sort();
    }

    function loadUpstream(upstreamData) {
      upstream = upstreamData;
    }
  }

  return UpstreamViewModel;
});
