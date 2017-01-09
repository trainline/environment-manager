/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let url = require('url');
let request = require('request');
let utils = require('modules/utilities');

let HttpRequestError = require('modules/errors/HttpRequestError.class');
let ResourceNotFoundError = require('modules/errors/ResourceNotFoundError.class');

function NginxUpstreamsResource() {
  function httpErrorToError(error) {
    switch (error.code) {
      case 'ENOTFOUND':
        return new ResourceNotFoundError(`Hostname "${error.hostname}" not found.`);
      default:
        return new HttpRequestError(`Remote host: ${error.code}`);
    }
  }

  function httpResponseToError(response) {
    return new HttpRequestError(`Remote host: ${response.body} - ${response.statusCode}`);
  }

  function invalidJsonToError(value) {
    return new HttpRequestError(`Remote host: Invalid JSON: ${value} - 200`);
  }

  function isNotNginxUpstreamPeerBackup(nginxUpstreamPeer) {
    return !nginxUpstreamPeer.backup;
  }

  function asUpstreamItem(nginxUpstreamPeer) {
    let upstreamItem = {
      Server: nginxUpstreamPeer.server,
      State: nginxUpstreamPeer.state,
      HealthChecks: nginxUpstreamPeer.health_checks,
    };

    return upstreamItem;
  }

  this.all = function (parameters) {
    let uri = url.format({
      protocol: 'http',
      hostname: parameters.instanceDomainName,
      pathname: '/status/upstreams',
    });

    return new Promise((resolve, reject) => {
      request(uri, (error, response, body) => {
        // Error connecting to the host
        if (error) return reject(httpErrorToError(error));

        // Error response from the host
        if (response.statusCode !== 200) return reject(httpResponseToError(response));

        // Unexpected non JSON body
        let nginxUpstreams = utils.safeParseJSON(body);
        if (!nginxUpstreams) return reject(invalidJsonToError(body));

        let upstreams = [];

        for (let upstreamName in nginxUpstreams) {

          let nginxUpstream = nginxUpstreams[upstreamName];

          if (!nginxUpstream || !nginxUpstream.peers) return invalidJsonToError(body);

          let upstream = {
            Name: upstreamName,
            Hosts: nginxUpstream.peers.filter(isNotNginxUpstreamPeerBackup).map(asUpstreamItem),
          };

          upstreams.push(upstream);
        }

        return resolve(upstreams);
      });
    });
  };
}

module.exports = {
  canCreate: resourceDescriptor => resourceDescriptor.type.toLowerCase() === 'nginx/upstreams',
  create: (resourceDescriptor, parameters) => Promise.resolve(new NginxUpstreamsResource()),
};
