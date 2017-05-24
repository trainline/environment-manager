'use strict';

let Service = require('models/Service');
let _ = require('lodash');

const DEFAULT_PORT = 0;

const getPort = (service, colour) => _.get(service, [0, 'Value', `${colour}Port`]);

function intOrDefault(maybePort) {
  let port = Number(maybePort);
  return Number.isInteger(port) ? port : DEFAULT_PORT;
}

function getServicePortConfig(serviceName) {
  let portConfig = { blue: DEFAULT_PORT, green: DEFAULT_PORT };

  if (serviceName === undefined || serviceName === '') {
    return Promise.resolve(portConfig);
  }

  return Service.getByName(serviceName.trim())
    .then(service => ({
      blue: intOrDefault(getPort(service, 'Blue')),
      green: intOrDefault(getPort(service, 'Green'))
    }));
}

module.exports = getServicePortConfig;
