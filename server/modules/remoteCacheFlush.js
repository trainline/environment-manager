'use strict';

let consulClient = require('./consul-client');
let _ = require('lodash');
let request = require('request').defaults({ strictSSL: false });
let logger = require('./logger');
let configEnvironments = require('./data-access/configEnvironments');
let config = require('../config');

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
    .then(results => results)
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
      let nodes = _.flatten(nodesLists).filter((n) => {
        // todo: Configuration String endpoint to store these ignore strings
        return stripPrefix(n.ServiceName).toLowerCase() === host.host.toLowerCase();
      });
      if (nodes) {
        nodes.forEach((node) => {
          let ip = node.Address;
          addresses.push({
            Address: `https://${ip}:${host.port}/diagnostics/cachereset`,
            Host: host.host,
            ServiceName: node.ServiceName
          });
        });
      }
    });
    return addresses;
  };
}

const stripToken = (options) => {
  if (options.body && options.body.token && !options.body.token.startsWith('[No Cache Reset Key Found]')) {
    delete options.body.token;
  }
  return options;
};

function sendRequestToAddresses(token, addresses) {
  let results = [];

  addresses.forEach((address) => {
    let options = {
      method: 'POST',
      uri: address.Address,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000,
      body: {
        token
      },
      json: true,
      metadata: {
        Host: address.Host,
        ServiceName: address.ServiceName
      }
    };

    results.push(new Promise((resolve, reject) => {
      request.post(options, (error, response, body) => {
        if (response && response.statusCode === 401) {
          let message = `401 received: ${JSON.stringify(stripToken(options))}`;
          let result = ({ status: 'info', message });
          resolve(result);
          logger.error(message);
        } else if (response && response.statusCode === 200) {
          let message = `'200 received: ${JSON.stringify(stripToken(options))}`;
          let result = ({ status: 'success', message });
          logger.info(message);
          resolve(result);
        } else {
          let message = `'Non 200-401 received: ${JSON.stringify(stripToken(options))}`;
          let result = ({ status: 'default', message });
          logger.info(message);
          resolve(result);
        }
      });
    }));
  });

  return Promise.all(results);
}

function getToken(EnvironmentName) {
  let key = { EnvironmentName };
  return configEnvironments.get(key)
    .then(getEnvironmentTypeValue)
    .then(getCacheResetKeyForEnvironment);

  function getEnvironmentTypeValue(environment) {
    return environment.Value.EnvironmentType;
  }

  function getCacheResetKeyForEnvironment(environmentType) {
    try {
      let value = config.getUserValue('local').CacheReset[environmentType].plain;
      return value;
    } catch (e) {
      return `[No Cache Reset Key Found] :: ${environmentType}`;
    }
  }
}

module.exports = {
  flush
};
