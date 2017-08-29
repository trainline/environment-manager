/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');

let ResourceNotFoundError = require('modules/errors/ResourceNotFoundError.class');
let InconsistentSlicesStatusError = require('modules/errors/InconsistentSlicesStatusError.class');
let logger = require('modules/logger');
let servicesDb = require('modules/data-access/services');
let loadBalancerUpstreams = require('modules/data-access/loadBalancerUpstreams');

function ToggleUpstreamByServiceVerifier(toggleCommand) {
  this.verifyUpstreams = (upstreams) => {
    return servicesDb.get({ ServiceName: upstreams[0].Service })
      .then(asPortMapping)
      .then(portMapping => Promise.map(upstreams, upstream => detectUpstreamInconsistency(upstream, portMapping)));
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
    if (upstream.Hosts.length === 0) {
      return makeUpstreamError(upstream, 'cannot be toggled because it has no slice');
    }

    if (upstream.Hosts.length === 1) {
      return makeUpstreamError(upstream, 'cannot be toggled because it has only one slice');
    }

    if (upstream.Hosts.length > 2) {
      return makeUpstreamError(upstream, 'cannot be toggled because it has more than two slices');
    }

    let statuses = [...new Set(upstream.Hosts.map((host) => { return host.State === 'up' ? 'Active' : 'Inactive'; }))];
    if (statuses.length === 1) {
      return makeUpstreamError(upstream, `cannot be toggled because all its slices are "${statuses[0]}"`);
    }

    let slicesNames = upstream.Hosts.map(host => portMapping[host.Port]);
    if (slicesNames.indexOf('Blue') < 0) {
      return makeUpstreamError(upstream, 'cannot be toggled because there is no way to detect which slice is "blue"');
    }

    if (slicesNames.indexOf('Green') < 0) {
      return makeUpstreamError(upstream, 'cannot be toggled because there is no way to detect which slice is "green"');
    }

    return Promise.resolve();
  }

  function makeUpstreamError(upstream, reason) {
    let message = `Upstream named "${upstream.Upstream}" which refers to "${upstream.Service}" service in "${upstream.Environment}" environment ${reason}.`;
    return Promise.reject(new InconsistentSlicesStatusError(message));
  }
}

function ToggleUpstreamByNameVerifier(resourceName) {
  return {
    verifyUpstreams(upstreams) {
      if (upstreams.length > 1) {
        let keys = upstreams.map(upstream => upstream.key).join(', ');
        let message = `${resourceName} cannot be toggled because all following keys refer to it: ${keys}.`;
        return Promise.reject(new InconsistentSlicesStatusError(message));
      }

      let upstream = upstreams[0];
      if (upstream.Hosts.length === 0) {
        let message = `Upstream named "${upstream.Upstream}" which refers to "${upstream.Service}" service in "${upstream.Environment}" environment cannot be toggled because it has no slice.`;
        return Promise.reject(new InconsistentSlicesStatusError(message));
      }

      return Promise.resolve();
    }
  };
}

function UpstreamProvider(_, toggleCommand, resourceName) {
  let { environmentName, serviceName, upstreamName } = toggleCommand;

  let errorIfNone = items => (items.length === 0
    ? Promise.reject(new ResourceNotFoundError(`No ${resourceName} has been found.`))
    : Promise.resolve(items));

  return {
    provideUpstreams() {
      if (serviceName) {
        return loadBalancerUpstreams.inEnvironmentWithService(environmentName, serviceName)
          .then(errorIfNone);
      } else if (upstreamName) {
        return loadBalancerUpstreams.inEnvironmentWithUpstream(environmentName, upstreamName)
          .then(errorIfNone);
      } else {
        return Promise.reject(`Expected one of serviceName, upstreamName in toggleCommand: ${toggleCommand}`);
      }
    }
  };
}

function UpstreamToggler(senderInstance, toggleCommand) {
  let metadata = {
    TransactionID: toggleCommand.commandId,
    User: toggleCommand.username
  };
  return {
    toggleUpstream(upstream) {
      return loadBalancerUpstreams.toggle(upstream, metadata);
    }
  };
}

function orchestrate(provider, verifier, toggler) {
  let upstreamsP = provider.provideUpstreams();
  let verifiedP = upstreamsP.then(upstreams => verifier.verifyUpstreams(upstreams));
  let toggledP = Promise.map(upstreamsP, upstream => toggler.toggleUpstream(upstream)
    .then(() => [null, upstream.Upstream])
    .catch(error => [error, upstream.Upstream]));
  return Promise.join(toggledP, verifiedP, toggled => ({
    ToggledUpstreams: toggled.reduce((acc, [error, data]) => {
      if (error) {
        logger.error(error);
        return acc;
      } else {
        return [...acc, data];
      }
    }, [])
  }));
}

module.exports = {
  UpstreamProvider,
  UpstreamToggler,
  orchestrate,
  ToggleUpstreamByServiceVerifier,
  ToggleUpstreamByNameVerifier
};
