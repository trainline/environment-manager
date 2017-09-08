'use strict';

let consulClient = require('modules/consul-client');
let _ = require('lodash');
let request = require('request').defaults({ strictSSL: false });
let logger = require('modules/logger');
let configEnvironments = require('modules/data-access/configEnvironments');
let config = require('config');

function flush(environment, hosts) {
  let consulClientInstance;
  let token;

  return consulClient.create({ environment, promisify: true })
    .then(storeInstance)
    .then(() => {
      return getToken(environment)
        .then((tokenValue) => {
          token = tokenValue;
        });
    })
    .then(getServicesInEnvironment)
    .then(convertServiceObjectToListOfServices)
    .then(getNodesForServices)
    .then(createAddresses(hosts))
    .then((addresses) => { return sendRequestToAddresses(token, addresses); })
    .catch((e) => {
      logger.error('Cache Reset Error: ', e);
      return { error: e.message };
    });

  function storeInstance(instance) {
    consulClientInstance = instance;
  }

  function getServicesInEnvironment() {
    return consulClientInstance.catalog.service.list();
  }

  function convertServiceObjectToListOfServices(services) {
    if (services) return Object.keys(services).map(s => s);
    else return [];
  }

  function getNodesForServices(serviceList) {
    // [ service: listOfNodesInService ]
    return Promise.all(serviceList.map((s) => {
      return consulClientInstance.catalog.service.nodes(s);
    }));
  }
}

function stripPrefix(value) {
  let prefixes = ['/^upstream_/', '/^slice_/'];
  let result = '';
  prefixes.forEach((p) => {
    result = value.replace(p, '');
  });
  return result;
}


function createAddresses(hosts) {
  return (nodesLists) => {
    let addresses = [];
    _.flatten(hosts).forEach((host) => {
      let node = _.flatten(nodesLists).find((n) => {
        // todo: Configuration String endpoint to store these ignore strings
        return stripPrefix(n.ServiceName) === host.host;
      });
      if (node) {
        let ip = node.Address;
        addresses.push({
          Address: `https://${ip}:${host.port}/diagnostics/cachereset`,
          Host: host.host,
          ServiceName: node.ServiceName
        });
      }
    });
    return addresses;
  };
}

function sendRequestToAddresses(token, addresses) {
  addresses.forEach((address) => {
    let options = {
      method: 'POST',
      uri: address.Address,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        token
      },
      json: true
    };

    request.post(options, (error, response, body) => {
      if (response && response.statusCode === 401) {
        logger.error('401 received: ', JSON.stringify(options));
      }
      if (response && response.statusCode === 200) {
        logger.info('200 received: ', JSON.stringify(options));
      }
    });
  });
}

function getToken(EnvironmentName) {
  return configEnvironments.get({ EnvironmentName })
    .then(getEnvironmentTypeValue)
    .then(getCacheResetKeyForEnvironment);

  function getEnvironmentTypeValue(environment) {
    return environment.EnvironmentType;
  }

  function getCacheResetKeyForEnvironment(environmentType) {
    try {
      let value = config.getUserValue('local').CacheReset[environmentType];
      return value;
    } catch (e) {
      return `[No Cache Reset Key Found] :: ${environmentType}`;
    }
  }
}

module.exports = {
  flush
};
