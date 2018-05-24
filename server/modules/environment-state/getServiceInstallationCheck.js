/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let serviceDiscovery = require('../service-discovery');
let { format } = require('../serviceName');
let request = Promise.promisify(require('request').defaults({ strictSSL: false }));

function unravelTags(tags) {
  return tags.reduce((val, tag) => {
    let tagComponents = tag.split(':');
    val[tagComponents[0]] = tagComponents[1];
    return val;
  }, {});
}
function pingNode(node) {
  let installCheckUrl = `https://${node.Address}:${node.ServicePort}/diagnostics/installationcheck`;
  let pingResult = {
    id: node.Node,
    ip: node.Address,
    port: node.ServicePort,
    tags: unravelTags(node.ServiceTags),
    installationcheckurl: installCheckUrl
  };
  return request(installCheckUrl, { timeout: 30000 }).then((response) => {
    return Object.assign(pingResult, { status: response.statusCode });
  }, (reason) => {
    return Object.assign(pingResult, { status: 0, reason: reason.code });
  });
}

function getServiceInstallationCheck({ environmentName, serviceName, slice }) {
  return serviceDiscovery.getNodesForService(environmentName, format(environmentName, serviceName, slice))
        .then(nodes => Promise.all(nodes.map(pingNode)));
}

module.exports = getServiceInstallationCheck;
