/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

describe('UpstreamViewModel', function () {
  var UpstreamViewModel;
  var defaultHost = { DnsName: '', Port: null, FailTimeout: '30s', MaxFails: null, State: 'down', Weight: 1 };

  beforeEach(module('EnvironmentManager.configuration'));

  beforeEach(inject(function (_UpstreamViewModel_) {
    UpstreamViewModel = _UpstreamViewModel_;
  }));

  it('Should not show the form before the view is initialised', function () {
    var vm = createUpstreamViewModel();
    expect(vm.showForm).toBe(false);
  });

  it('Should show a loading indicator before the view is initialised', function () {
    var vm = createUpstreamViewModel();
    expect(vm.title).toBe('Loading...');
  });

  it('Should show the form once the view is initialised', function () {
    var vm = createAndInitUpstreamViewModel();
    expect(vm.showForm).toBe(true);
  });

  it('Should show title "Edit Upstream: ..." when editing an upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'Edit' });
    init(vm, { upstream: createSimpleTestUpstream() });
    expect(vm.title).toBe('Edit Upstream: TestUpstream');
  });

  it('Should show title "Copy Upstream: ..." when editing an upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'Copy' });
    init(vm, { upstream: createSimpleTestUpstream() });
    expect(vm.title).toBe('Copy Upstream: TestUpstream');
  });

  it('Should show the name field when copying an upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'Copy' });
    expect(vm.showNameField).toBe(true);
  });

  it('Should show the name field when creating a new upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'New' });
    expect(vm.showNameField).toBe(true);
  });

  it('Should not show the name field when editing a new upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'Edit' });
    expect(vm.showNameField).toBe(false);
  });

  it('Should allow the environment to be edited when copying an upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'Copy' });
    expect(vm.showEnvironmentEditorField).toBe(true);
    expect(vm.showEnvironmentReadOnlyField).toBe(false);
  });

  it('Should not allow the environment to be edited when creating a new upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'New' });
    expect(vm.showEnvironmentEditorField).toBe(false);
    expect(vm.showEnvironmentReadOnlyField).toBe(true);
  });

  it('Should not allow the environment to be edited when editing an upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'Edit' });
    expect(vm.showEnvironmentEditorField).toBe(false);
    expect(vm.showEnvironmentReadOnlyField).toBe(true);
  });

  it('Should allow config fields to be edited when creating a new upstream if the user has permission', function () {
    var vm = createAndInitUpstreamViewModel();
    expect(vm.configFieldsDisabled).toBe(false);
    expect(vm.configFieldsEnabled).toBe(true);
  });

  it('Should enable config fields when creating a new upstream', function () {
    var vm = createAndInitUpstreamViewModel();
    expect(vm.configFieldsDisabled).toBe(false);
    expect(vm.configFieldsEnabled).toBe(true);
  });

  it('Should disable config fields when the user does not have permissions to edit upstreams', function () {
    var testUpstream = createSimpleTestUpstream();
    var testUser = createUserWhoCantEdit(testUpstream.Value.UpstreamName);
    var vm = createUpstreamViewModel({ mode: 'Edit', user: testUser });
    init(vm, { upstream: testUpstream });
    expect(vm.configFieldsDisabled).toBe(true);
    expect(vm.configFieldsEnabled).toBe(false);
  });

  it('Should disable config fields when the user does not have permissions to create upstreams', function () {
    var testUser = createUserWhoCantCreate();
    var vm = createUpstreamViewModel({ mode: 'New', user: testUser });
    expect(vm.configFieldsDisabled).toBe(true);
    expect(vm.configFieldsEnabled).toBe(false);
  });

  it('Should enable config fields when the user has permissions to edit upstreams', function () {
    var testUser = createAdminUser();
    var vm = createUpstreamViewModel({ mode: 'Edit', user: testUser });
    init(vm, { upstream: createSimpleTestUpstream() });
    expect(vm.configFieldsDisabled).toBe(false);
    expect(vm.configFieldsEnabled).toBe(true);
  });

  it('Should sort service names drop down', function () {
    var vm = createUpstreamViewModel();
    init(vm, { services: [{ ServiceName: 's2' }, { ServiceName: 's1' }] });
    expect(vm.services).toEqual(['s1', 's2']);
  });

  it('Should sort environment names drop down', function () {
    var vm = createUpstreamViewModel();
    init(vm, { environments: [{ EnvironmentName: 'e2' }, { EnvironmentName: 'e1' }] });
    expect(vm.environments).toEqual(['e1', 'e2']);
  });

  it('Should not show the service link if no service is selected', function () {
    var vm = createUpstreamViewModel();
    expect(vm.showServiceLink()).toBe(false);
    expect(vm.serviceLink()).toEqual(null);
  });

  it('Should show the correct service link when a service is selected', function () {
    var vm = createUpstreamViewModel();
    var testUpstream = createSimpleTestUpstream();
    init(vm, { upstream: testUpstream });
    testUpstream.Value.ServiceName = 's2';
    expect(vm.showServiceLink()).toBe(true);
    expect(vm.serviceLink()).toEqual('/#/config/services/s2/?Range=c2');
  });

  it('Should hide the toggle link when copying an upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'Copy' });
    expect(vm.showToggleLink()).toBe(false);
  });

  it('Should hide the toggle link when creating an upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'New' });
    expect(vm.showToggleLink()).toBe(false);
  });

  it('Should show the toggle link when editing an upstream that has an environment and service', function () {
    var vm = createUpstreamViewModel({ mode: 'Edit' });
    var testUpstream = createSimpleTestUpstream();
    init(vm, { upstream: testUpstream });
    testUpstream.Value.EnvironmentName = 'e01';
    testUpstream.Value.ServiceName = 'mysvc';
    expect(vm.showToggleLink()).toBe(true);
  });

  it('Should show the correct toggle link when a service is selected', function () {
    var vm = createUpstreamViewModel();
    var testUpstream = createSimpleTestUpstream();
    init(vm, { upstream: testUpstream });
    testUpstream.Value.EnvironmentName = 'e01';
    testUpstream.Value.ServiceName = 'mysvc';
    expect(vm.toggleLink()).toEqual('/#/operations/upstreams?environment=e01&state=All&service=mysvc');
  });

  it('Should show new host line when creating a new Upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'New' });
    expect(vm.newHost).toEqual(defaultHost);
  });

  it('Should show new host line when the new host button is clicked', function () {
    var vm = createUpstreamViewModel({ mode: 'Edit' });
    vm.createNewHost();
    expect(vm.newHost).toEqual(defaultHost);
  });

  it('Should not show new host line when editing an Upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'Edit' });
    expect(vm.newHost).not.toBeDefined();
  });

  it('Should not show new host line when copying an Upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'Copy' });
    expect(vm.newHost).not.toBeDefined();
  });

  it('Should not clear the current new host values when the new host button is clicked', function () {
    var vm = createAndInitUpstreamViewModel();
    vm.newHost.DnsName = 'test';
    vm.createNewHost();
    expect(vm.newHost).not.toEqual(defaultHost);
  });

  it('Should hide the new host editor once a new host has been added', function () {
    var vm = createUpstreamViewModel();
    vm.newHost.DnsName = 'test';
    vm.clearNewHostEditor();
    expect(vm.newHost).not.toBeDefined();
  });

  it('Should report that the new host is valid if no all host fields have been entered', function () {
    var vm = createUpstreamViewModel();
    _.assign(vm.newHost, { DnsName: 'test', Port: 8080 });
    expect(vm.newHostIsValid()).toBe(true);
  });

  it('Should report that the new host is not valid if no Consul Service Name has been entered', function () {
    var vm = createUpstreamViewModel();
    _.assign(vm.newHost, { Port: 8080 });
    expect(vm.newHostIsValid()).toBe(false);
  });

  it('Should report that the new host is not valid if no Port has been entered', function () {
    var vm = createUpstreamViewModel();
    _.assign(vm.newHost, { DnsName: 'test' });
    expect(vm.newHostIsValid()).toBe(false);
  });

  it('Should report that the new host is not valid if no Weight has been entered', function () {
    var vm = createUpstreamViewModel();
    delete vm.newHost.Weight;
    expect(vm.newHostIsValid()).toBe(false);
  });

  it('Should show new host link when editing an upstream', function () {
    var vm = createUpstreamViewModel({ mode: 'Edit' });
    init(vm);
    expect(vm.showCreateHostLink()).toBe(true);
  });

  it('Should not show new host link when already creating one', function () {
    var vm = createUpstreamViewModel({ mode: 'Edit' });
    init(vm);
    vm.createNewHost();
    expect(vm.showCreateHostLink()).toBe(false);
  });

  it('Should not show new host link when user has no edit permissions', function () {
    var testUpstream = createSimpleTestUpstream();
    var testUser = createUserWhoCantEdit();
    var vm = createUpstreamViewModel({ mode: 'Edit', user: testUser });
    init(vm, { upstream: testUpstream });
    expect(vm.showCreateHostLink()).toBe(false);
  });

  it('Should show an error instead of the form if an error occurred collecting data for initialisation', function () {
    var vm = createUpstreamViewModel();
    vm.errorOnInit('Something bad');
    expect(vm.showError).toBe(true);
    expect(vm.errorMessage).toBe('Something bad');
    expect(vm.showForm).toBe(false);
  });

  it('Should show a validation error when needed', function () {
    var vm = createUpstreamViewModel();
    vm.showValidationError('Something not right');
    expect(vm.validationError).toBe('Something not right');
  });

  function createAndInitUpstreamViewModel() {
    var vm = createUpstreamViewModel();
    init(vm);
    return vm;
  }

  function createUpstreamViewModel(params) {
    var defaultParams = { mode: 'New', user: createAdminUser() };
    return new UpstreamViewModel(_.assign(defaultParams, params));
  }

  function init(view, resources) {
    var defaults = {
      environments: [{ EnvironmentName: 'e2' }, { EnvironmentName: 'e1' }],
      services: [{ ServiceName: 's2', OwningCluster: 'c2' }, { ServiceName: 's1', OwningCluster: 'c1' }],
      upstream: { Value: { EnvironmentName: 'e1', Hosts: [] } }
    };
    view.init(_.assign(defaults, resources));
  }

  function createAdminUser() {
    return { hasPermission: function () { return true; } };
  }

  function createSimpleTestUpstream() {
    return { Value: { UpstreamName: 'TestUpstream', ServiceName: 's1', Hosts: [] } };
  }

  function createUserWhoCantEdit(upstreamName) {
    return {
      hasPermission: function (permission) {
        if (!upstreamName) return false;

        if (!(permission.access === 'PUT' && permission.resource === '/config/upstreams/' + upstreamName)) {
          throw new Error('Incorrect Permission Check');
        }

        return false;
      }
    };
  }

  function createUserWhoCantCreate() {
    return {
      hasPermission: function (permission) {
        if (!(permission.access === 'POST' && permission.resource === '/config/upstreams/*')) {
          throw new Error('Incorrect Permission Check');
        }

        return false;
      }
    };
  }
});
