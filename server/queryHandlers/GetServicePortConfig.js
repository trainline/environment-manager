'use strict';

let Service = require('models/Service');
let co = require('co');
let _ = require('lodash');

function* getServicePortConfig(serviceName) {
  let portConfig = { blue: 0, green: 0 };

  if (serviceName === undefined || serviceName === '') {
    return portConfig;
  }

  serviceName = serviceName.trim(); // eslint-disable-line no-param-reassign
  const service = yield Service.getByName(serviceName);
  if (service === undefined) {
    return portConfig;
  }

  const configValue = _.get(service, '[0].Value');
  if (configValue === undefined) {
    return portConfig;
  }
  if (configValue.BluePort !== undefined) {
    portConfig.blue = configValue.BluePort;
  }
  if (configValue.GreenPort !== undefined) {
    portConfig.green = configValue.GreenPort;
  }
  return portConfig;
}

module.exports = co.wrap(getServicePortConfig);
