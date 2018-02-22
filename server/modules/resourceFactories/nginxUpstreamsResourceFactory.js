/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const url = require('url');
const request = require('request-promise').defaults({ strictSSL: false });
const utils = require('../utilities');
const logger = require('../logger');
const _ = require('lodash');

const HttpRequestError = require('../errors/HttpRequestError.class');
const ResourceNotFoundError = require('../errors/ResourceNotFoundError.class');

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
    return new HttpRequestError(`Remote host: ${response.statusCode}`);
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
      HealthChecks: nginxUpstreamPeer.health_checks
    };

    return upstreamItem;
  }

  this.all = function all(parameters) {
    const uri = url.format({
      protocol: 'https',
      hostname: parameters.instanceDomainName,
      pathname: '/api/2/http/upstreams'
    });
    const requestOptions = {
      method: 'GET',
      uri,
      resolveWithFullResponse: true
    };

    return request(requestOptions)
      .then((response) => {
        if (response.statusCode !== 200) {
          logger.error(`Unexpected Nginx Upstream response: ${response.body}`,
            { body: response.body, statusCode: response.statusCode });
          return Promise.reject({ type: 'httpResponseToError', value: response });
        }

        let nginxUpstreams = utils.safeParseJSON(response.body);
        if (!nginxUpstreams) return Promise.reject({ type: 'invalidJsonToError', value: response.body });

        let upstreams = _.entries(nginxUpstreams).map(([upstreamName, nginxUpstream]) => {
          if (!_.has(nginxUpstream, 'peers')) return null;

          let upstream = {
            Name: upstreamName,
            Hosts: nginxUpstream.peers.filter(isNotNginxUpstreamPeerBackup).map(asUpstreamItem)
          };

          return upstream;
        });

        return _.compact(upstreams);
      })
      .catch((e) => {
        switch (e.type) {
          case 'httpResponseToError':
            return Promise.reject(httpResponseToError(e.value));
          case 'httpErrorToError':
            return Promise.reject(httpErrorToError(e.value));
          case 'invalidJsonToError':
            return Promise.reject(invalidJsonToError(e.value));
          default:
            return Promise.reject(e);
        }
      });
  };
}

module.exports = {
  canCreate: resourceDescriptor => resourceDescriptor.type.toLowerCase() === 'nginx/upstreams',
  create: () => Promise.resolve(new NginxUpstreamsResource())
};
