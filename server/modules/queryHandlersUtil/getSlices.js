/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let co = require('co');
let _ = require('lodash');
let ResourceNotFoundError = require('../errors/ResourceNotFoundError.class');
let servicesDb = require('../data-access/services');

function hostFilter(active) {
  if (active === true) {
    return host => host.State === 'up';
  } else if (active === false) {
    return host => host.State === 'down';
  } else {
    return host => true;
  }
}

function* handleQuery(query, inputUpstreams) {
  // Get all LoadBalancer upstreams from DynamoDB without apply any filter.
  // NOTE: If it ever becomes a DynamoDB map item then filtering this query
  //       would be great!

  // If any upstream was found the chain continues otherwise a
  // [ResourceNotFound] error is returned.
  if (!inputUpstreams.length) {
    throw new ResourceNotFoundError('No load balancer upstream has been found.');
  }

  // Flatting upstreams hosts in to a plain list
  // eslint-disable-next-line arrow-body-style
  let upstreamValues = (upstream) => {
    return upstream.Hosts.filter(hostFilter(query.active)).map(host => ({
      Key: upstream.Key,
      EnvironmentName: upstream.Environment,
      ServiceName: upstream.Service,
      UpstreamName: upstream.Upstream,
      DnsName: host.DnsName,
      Port: host.Port,
      OwningCluster: '',
      Name: 'Unknown',
      State: host.State === 'up' ? 'Active' : 'Inactive'
    }));
  };

  let upstreams = _(inputUpstreams).map(upstreamValues).compact().flatten().value();
  // Getting all services the upstreams refer to

  // Extracts all service names the found upstreams refer to
  let serviceNames = [...new Set(upstreams.map(upstream => upstream.ServiceName))];

  // Gets all services from DynamoDB table
  let services = yield Promise.map(serviceNames, ServiceName => servicesDb.get({ ServiceName }))
    .then(ss => ss.filter(s => s));

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

module.exports = {
  handleQuery: co.wrap(handleQuery)
};
