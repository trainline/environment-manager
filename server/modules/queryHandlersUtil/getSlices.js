/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let sender = require('modules/sender');
let co = require('co');
let config = require('config');
let _ = require('lodash');
let ResourceNotFoundError = require('modules/errors/ResourceNotFoundError.class');

function* handleQuery(query, resourceName, upstreamFilter, hostFilter) {
  const masterAccountName = config.getUserValue('masterAccountName');

  // Get all LoadBalancer upstreams from DynamoDB without apply any filter.
  // NOTE: If it ever becomes a DynamoDB map item then filtering this query
  //       would be great!

  // Requires all LoadBalancer upstreams in the specified AWS account.
  let subquery = {
    name: 'ScanDynamoResources',
    resource: 'config/lbupstream',
    accountName: query.accountName,
  };

  let upstreams = yield sender.sendQuery({ query: subquery, parent: query });

  // Filtering upstreams
  upstreams = upstreams.filter(upstreamFilter);

  // If any upstream was found the chain continues otherwise a
  // [ResourceNotFound] error is returned.
  if (!upstreams.length) {
    throw new ResourceNotFoundError(`No ${resourceName} has been found.`);
  }

  // Flatting upstreams hosts in to a plain list
  // eslint-disable-next-line arrow-body-style
  let upstreamValues = (upstream) => {
    return upstream.Value.Hosts.filter(hostFilter).map((host) => (
      {
        Key: upstream.key,
        EnvironmentName: upstream.Value.EnvironmentName,
        ServiceName: upstream.Value.ServiceName,
        UpstreamName: upstream.Value.UpstreamName,
        DnsName: host.DnsName,
        Port: host.Port,
        OwningCluster: '',
        Name: 'Unknown',
        State: host.State === 'up' ? 'Active' : 'Inactive',
      }
    ));
  };

  upstreams = _(upstreams).map(upstreamValues).compact().flatten().value();
  // Getting all services the upstreams refer to

  // Extracts all service names the found upstreams refer to
  let serviceNames = upstreams.map(upstream => upstream.ServiceName).distinct();

  // Gets all services from DynamoDB table
  let promises = serviceNames.map((serviceName) => {
    let newSubquery = {
      name: 'ScanDynamoResources',
      resource: 'config/services',
      accountName: masterAccountName,
      filter: { ServiceName: serviceName },
    };
    return sender.sendQuery({ query: newSubquery, parent: query });
  });

  let services = yield Promise.all(promises);
  let hasLength = x => x && x.length;
  services = _(services).filter(hasLength).flatten();

  // Assigning blue/green port reference to the found slices
  function getServicesPortMapping(sliceServices) {
    let result = {};
    sliceServices.forEach((service) => {
      let portsMapping = {};
      portsMapping.owningCluster = service.OwningCluster;
      if (service.Value.BluePort) portsMapping[service.Value.BluePort] = 'Blue';
      if (service.Value.GreenPort) portsMapping[service.Value.GreenPort] = 'Green';
      result[service.ServiceName] = portsMapping;
    });

    return result;
  }

  let servicesPortsMapping = getServicesPortMapping(services);

  upstreams.forEach((upstream) => {
    let servicePortsMapping = servicesPortsMapping[upstream.ServiceName];
    if (!servicePortsMapping) return;
    upstream.OwningCluster = servicePortsMapping.owningCluster;
    let portMapping = servicePortsMapping[upstream.Port];
    if (!portMapping) return;
    upstream.Name = portMapping;
  });

  return upstreams;
}

let QUERYING = {
  upstream: {
    byUpstreamName: query => `Upstream named "${query.upstreamName}"`,
    byServiceName: query => `Upstream for service "${query.serviceName}" in "${query.environmentName}" environment`,
  },
};

let FILTER = {
  upstream: {
    byUpstreamName: (query) => upstream =>
        upstream.Value.EnvironmentName === query.environmentName && upstream.Value.UpstreamName === query.upstreamName,

    byServiceName: (query) => upstream =>
        upstream.Value.EnvironmentName === query.environmentName && upstream.Value.ServiceName === query.serviceName,
  },
  host: {
    allSlices: host => true,
    onlyActiveSlices: host => host.State === 'up',
    onlyInactiveSlices: host => host.State === 'down',
  },
};

module.exports = {
  handleQuery: co.wrap(handleQuery),
  QUERYING,
  FILTER,
};
