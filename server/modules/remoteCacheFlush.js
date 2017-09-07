'use strict';

let consulClient = require('modules/consul-client');
let _ = require('lodash');
let request = require('request');
let logger = require('modules/logger');

function flush(environment, hosts) {
  let clientInstance;

  return consulClient.create({ environment, promisify: true })
    .then(storeInstance)
    .then(getServicesInEnvironment)
    .then(convertServiceObjectToListOfServices)
    .then(getNodesForServices)
    .then(createAddresses(hosts))
    .then(sendRequestToAddresses)
    .catch((e) => {
      return { error: e.message };
    });

  function storeInstance(instance) {
    clientInstance = instance;
  }

  function getServicesInEnvironment() {
    return clientInstance.catalog.service.list();
  }

  function convertServiceObjectToListOfServices(services) {
    return Object.keys(services).map(s => s);
  }

  function getNodesForServices(serviceList) {
    // [ service: listOfNodesInService ]
    return Promise.all(serviceList.map((s) => {
      return clientInstance.catalog.service.nodes(s);
    }));
  }
}

function createAddresses(hosts) {
  return (nodesLists) => {
    let addresses = [];
    _.flatten(hosts).forEach((host) => {
      let node = _.flatten(nodesLists).find(n => n.ServiceName === host.host);
      if (node) addresses.push(`https://${node.Address}:${host.port}/diagnostics/cachereset`);
    });
    return addresses;
  };
}

function sendRequestToAddresses(addresses) {
  addresses.forEach((address) => {
    logger.info(`[CacheReset::Sent] to ${address}`);
    request.post(address);
  });
}

module.exports = {
  flush
};
