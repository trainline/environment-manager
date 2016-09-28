/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let async = require('async');
let config = require('config');
let sender = require('modules/sender');

let ResourceNotFoundError = require('modules/errors/ResourceNotFoundError.class');
let InconsistentSlicesStatusError = require('modules/errors/InconsistentSlicesStatusError.class');

function ToggleUpstreamByServiceVerifier(toggleCommand) {
  var $this = this;

  $this.verifyUpstreams = (upstreams, mainCallback) => {
    // TODO(filip): remove async
    const masterAccountName = config.getUserValue('masterAccountName');

    async.waterfall([
      (callback) => {
        var query = {
          name: 'ScanDynamoResources',
          resource: 'config/services',
          accountName: masterAccountName,
          filter: {
            ServiceName: upstreams[0].Value.ServiceName,
          },
        };

        sender.sendQuery({ query: query, parent: toggleCommand }, (error, services) => {
          if (error) callback(error);
          else callback(null, asPortMapping(services[0]));
        });
      },

      (portMapping, callback) => {
        function upstreamIterator(upstream, iteratorCallback) {
          var inconsistency = detectUpstreamInconsistency(upstream, portMapping);
          iteratorCallback(inconsistency);
        }

        async.each(upstreams, upstreamIterator, callback);
      },
    ], mainCallback);
  };

  function asPortMapping(service) {
    var portMapping = {};
    if (service) {
      if (service.Value.BluePort) portMapping[service.Value.BluePort] = 'Blue';
      if (service.Value.GreenPort) portMapping[service.Value.GreenPort] = 'Green';
    }

    return portMapping;
  }

  function detectUpstreamInconsistency(upstream, portMapping) {
    if (upstream.Value.Hosts.length == 0) {
      return makeUpstreamError(upstream, 'cannot be toggled because it has no slice');
    }

    if (upstream.Value.Hosts.length == 1) {
      return makeUpstreamError(upstream, 'cannot be toggled because it has only one slice');
    }

    if (upstream.Value.Hosts.length > 2) {
      return makeUpstreamError(upstream, 'cannot be toggled because it has more than two slices');
    }

    var statuses = upstream.Value.Hosts.map((host) => {
      return host.State === 'up' ? 'Active' : 'Inactive';
    }).distinct();
    if (statuses.length == 1) {
      return makeUpstreamError(upstream, `cannot be toggled because all its slices are "${statuses[0]}"`);
    }

    var slicesNames = upstream.Value.Hosts.map((host) => {
      return portMapping[host.Port]; });
    if (slicesNames.indexOf('Blue') < 0) {
      return makeUpstreamError(upstream, 'cannot be toggled because there is no way to detect which slice is "blue"');
    }

    if (slicesNames.indexOf('Green') < 0) {
      return makeUpstreamError(upstream, 'cannot be toggled because there is no way to detect which slice is "green"');
    }

    return null;
  }

  function makeUpstreamError(upstream, reason) {
    var message = `Upstream named "${upstream.Value.UpstreamName}" which refers to "${upstream.Value.ServiceName}" service in "${upstream.Value.EnvironmentName}" environment ${reason}.`;
    return new InconsistentSlicesStatusError(message);
  }
}

function ToggleUpstreamByNameVerifier(resourceName) {
  var $this = this;

  $this.verifyUpstreams = (upstreams, callback) => {
    var inconsistency = detectUpstreamsInconsistency(upstreams);
    callback(inconsistency);
  };

  function detectUpstreamsInconsistency(upstreams) {
    if (upstreams.length > 1) {
      var keys = upstreams.map((upstream) => {
        return upstream.key; }).join(', ');
      var message = `${resourceName} cannot be toggled because all following keys refer to it: ${keys}.`;
      return new InconsistentSlicesStatusError(message);
    }

    var upstream = upstreams[0];
    if (upstream.Value.Hosts.length == 0) {
      var message = `Upstream named "${upstream.Value.UpstreamName}" which refers to "${upstream.Value.ServiceName}" service in "${upstream.Value.EnvironmentName}" environment cannot be toggled because it has no slice.`;
      return new InconsistentSlicesStatusError(message);
    }

    return null;
  }
}

function UpstreamProviderBase(sender, toggleCommand, resourceName) {
  var $this = this;
  $this.provideUpstreams = (condition, mainCallback) => {
    // TODO(filip): remove async
    async.waterfall([
      (callback) => {
        // Requires all LoadBalancer upstreams in the specified AWS account.
        var query = {
          name: 'ScanDynamoResources',
          resource: 'config/lbupstream',
          accountName: toggleCommand.accountName,
        };

        sender.sendQuery({ query: query, parent: toggleCommand }, callback);
      },

      (upstreams, callback) => {
        var filteredUpstreams = upstreams.filter(condition);

        if (filteredUpstreams.length) callback(null, filteredUpstreams);
        else callback(new ResourceNotFoundError(`No ${resourceName} has been found.`));
      },
    ], mainCallback);
  };
}

function UpstreamByServiceProvider(sender, toggleCommand, resourceName) {
  var $this = this;
  var $base = new UpstreamProviderBase(sender, toggleCommand, resourceName);

  $this.provideUpstreams = (callback) => {
    var condition = (upstream) => {
      return upstream.Value.EnvironmentName === toggleCommand.environmentName && upstream.Value.ServiceName === toggleCommand.serviceName;
    };

    $base.provideUpstreams(condition, callback);
  };
}

function UpstreamByNameProvider(sender, toggleCommand, resourceName) {
  var $this = this;
  var $base = new UpstreamProviderBase(sender, toggleCommand, resourceName);

  $this.provideUpstreams = (callback) => {
    var condition = (upstream) => {
      return upstream.Value.EnvironmentName === toggleCommand.environmentName && upstream.Value.UpstreamName === toggleCommand.upstreamName;
    };

    $base.provideUpstreams(condition, callback);
  };

}

function UpstreamToggler(sender, toggleCommand) {
  var $this = this;
  $this.toggleUpstream = (upstream, callback) => {
    function toggleHost(host) {
      host.State = (host.State === 'up' ? 'down' : 'up');
    }

    upstream.Value.Hosts.forEach(toggleHost);
    var command = {
      name: 'UpdateDynamoResource',
      resource: 'config/lbupstream',
      key: upstream.key,
      item: upstream,
      accountName: toggleCommand.accountName,
    };
    sender.sendCommand({ command: command, parent: toggleCommand }, callback);
  };

}

function ToggleSlicesOrchestrator(provider, verifier, toggler) {
  var $this = this;
  $this.orchestrate = (mainCallback) => {
    // TODO(filip): remove async
    async.waterfall([
      (callback) => {
        provider.provideUpstreams(callback);

      },

      (upstreams, callback) => {
        verifier.verifyUpstreams(upstreams, (error) => {
          if (error) callback(error);
          else callback(null, upstreams);
        });
      },

      (upstreams, callback) => {
        async.map(upstreams, toggler.toggleUpstream, (error, childResults) => {
          if (error) {
            callback(error);
            return;
          }

          var toggledUpstreamNames = upstreams.map((upstream) => {
            return upstream.Value.UpstreamName;
          });
          callback(null, { ToggledUpstreams: toggledUpstreamNames });
        });
      },
    ], mainCallback);
  };
}

module.exports = {
  UpstreamByNameProvider,
  UpstreamByServiceProvider,
  UpstreamToggler,
  ToggleSlicesOrchestrator,
  ToggleUpstreamByServiceVerifier,
  ToggleUpstreamByNameVerifier,
};
