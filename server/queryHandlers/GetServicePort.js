'use strict';

let Service = require('models/Service');
let co = require('co');
let _ = require('lodash');

function* getServicePort(serviceName, slice) {
  if (serviceName === undefined || serviceName === '') {
    return 0;
  }
  if (slice !== undefined && (typeof slice) === 'string') {
    slice = slice.toLowerCase().trim(); // eslint-disable-line no-param-reassign
  }
  if (slice === 'none') {
    return 0;
  }

  serviceName = serviceName.trim(); // eslint-disable-line no-param-reassign
  const service = yield Service.getByName(serviceName);
  if (service === undefined) {
    return 0;
  }

  const configValue = _.get(service, '[0].Value');
  if (configValue === undefined) {
    return 0;
  }
  if (slice === 'blue') {
    return configValue.BluePort || 0;
  } else if (slice === 'green') {
    return configValue.GreenPort || 0;
  }
  return 0;
}

module.exports = co.wrap(getServicePort);
