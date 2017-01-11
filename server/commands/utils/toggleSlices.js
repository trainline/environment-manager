/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let config = require('config');
let sender = require('modules/sender');
let _ = require('lodash');

let ResourceNotFoundError = require('modules/errors/ResourceNotFoundError.class');
let InconsistentSlicesStatusError = require('modules/errors/InconsistentSlicesStatusError.class');

function ToggleUpstreamByServiceVerifier(toggleCommand) {
  this.verifyUpstreams = (upstreams) => {
    const masterAccountName = config.getUserValue('masterAccountName');
    return co(function* () {
      let query = {
        name: 'ScanDynamoResources',
        resource: 'config/services',
        accountName: masterAccountName,
        filter: {
          ServiceName: upstreams[0].Value.ServiceName
        }
      };

      let services = yield sender.sendQuery({ query, parent: toggleCommand });
      let portMapping = asPortMapping(services[0]);


      yield _.map(upstreams, upstream => detectUpstreamInconsistency(upstream, portMapping));
    });
  };

  function asPortMapping(service) {
    let portMapping = {};
    if (service) {
      if (service.Value.BluePort) portMapping[service.Value.BluePort] = 'Blue';
      if (service.Value.GreenPort) portMapping[service.Value.GreenPort] = 'Green';
    }

    return portMapping;
  }

  function detectUpstreamInconsistency(upstream, portMapping) {
    if (upstream.Value.Hosts.length === 0) {
      return makeUpstreamError(upstream, 'cannot be toggled because it has no slice');
    }

    if (upstream.Value.Hosts.length === 1) {
      return makeUpstreamError(upstream, 'cannot be toggled because it has only one slice');
    }

    if (upstream.Value.Hosts.length > 2) {
      return makeUpstreamError(upstream, 'cannot be toggled because it has more than two slices');
    }

    let statuses = upstream.Value.Hosts.map((host) => { return host.State === 'up' ? 'Active' : 'Inactive'; }).distinct();
    if (statuses.length === 1) {
      return makeUpstreamError(upstream, `cannot be toggled because all its slices are "${statuses[0]}"`);
    }

    let slicesNames = upstream.Value.Hosts.map(host => portMapping[host.Port]);
    if (slicesNames.indexOf('Blue') < 0) {
      return makeUpstreamError(upstream, 'cannot be toggled because there is no way to detect which slice is "blue"');
    }

    if (slicesNames.indexOf('Green') < 0) {
      return makeUpstreamError(upstream, 'cannot be toggled because there is no way to detect which slice is "green"');
    }

    return Promise.resolve();
  }

  function makeUpstreamError(upstream, reason) {
    let message = `Upstream named "${upstream.Value.UpstreamName}" which refers to "${upstream.Value.ServiceName}" service in "${upstream.Value.EnvironmentName}" environment ${reason}.`;
    return Promise.reject(new InconsistentSlicesStatusError(message));
  }
}

function ToggleUpstreamByNameVerifier(resourceName) {
  this.verifyUpstreams = (upstreams) => {
    if (upstreams.length > 1) {
      let keys = upstreams.map(upstream => upstream.key).join(', ');
      let message = `${resourceName} cannot be toggled because all following keys refer to it: ${keys}.`;
      return Promise.reject(new InconsistentSlicesStatusError(message));
    }

    let upstream = upstreams[0];
    if (upstream.Value.Hosts.length === 0) {
      let message = `Upstream named "${upstream.Value.UpstreamName}" which refers to "${upstream.Value.ServiceName}" service in "${upstream.Value.EnvironmentName}" environment cannot be toggled because it has no slice.`;
      return Promise.reject(new InconsistentSlicesStatusError(message));
    }

    return Promise.resolve();
  };
}

function UpstreamProvider(senderInstance, toggleCommand, resourceName) {
  this.provideUpstreams = () => co(function* () {
      // Requires all LoadBalancer upstreams in the specified AWS account.
    let query = {
      name: 'ScanDynamoResources',
      resource: 'config/lbupstream',
      accountName: toggleCommand.accountName
    };

    let upstreams = yield senderInstance.sendQuery({ query, parent: toggleCommand });
    let filteredUpstreams = _.filter(upstreams, upstream => upstream.Value.EnvironmentName === toggleCommand.environmentName);
    if (toggleCommand.serviceName) {
      filteredUpstreams = _.filter(filteredUpstreams, upstream => upstream.Value.ServiceName === toggleCommand.serviceName);
    }
    if (toggleCommand.upstreamName) {
      filteredUpstreams = _.filter(filteredUpstreams, upstream => upstream.Value.UpstreamName === toggleCommand.upstreamName);
    }

    if (filteredUpstreams.length) return filteredUpstreams;
    else throw new ResourceNotFoundError(`No ${resourceName} has been found.`);
  });
}

function UpstreamToggler(senderInstance, toggleCommand) {
  this.toggleUpstream = (upstream) => {
    function toggleHost(host) {
      host.State = (host.State === 'up' ? 'down' : 'up');
    }

    upstream.Value.Hosts.forEach(toggleHost);
    let command = {
      name: 'UpdateDynamoResource',
      resource: 'config/lbupstream',
      key: upstream.key,
      item: upstream,
      accountName: toggleCommand.accountName
    };
    return senderInstance.sendCommand({ command, parent: toggleCommand });
  };
}

function* orchestrate(provider, verifier, toggler) {
  let upstreams = yield provider.provideUpstreams();
  yield verifier.verifyUpstreams(upstreams);
  yield _.map(upstreams, toggler.toggleUpstream);

  return {
    ToggledUpstreams: _.map(upstreams, 'Value.UpstreamName')
  };
}

module.exports = {
  UpstreamProvider,
  UpstreamToggler,
  orchestrate: co.wrap(orchestrate),
  ToggleUpstreamByServiceVerifier,
  ToggleUpstreamByNameVerifier
};
