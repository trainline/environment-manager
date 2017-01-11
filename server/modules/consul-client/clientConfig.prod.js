/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let configurationCache = require('modules/configurationCache');
let consulSecretCache = require('modules/consulSecretCache');
let _ = require('lodash');

function* getConsulClientOptions(parameters) {
  let environmentName = parameters.environment;
  let environment = yield configurationCache.getEnvironmentByName(environmentName);
  let environmentType = yield configurationCache.getEnvironmentTypeByName(environment.EnvironmentType);
  let consul = environmentType.Consul;
  let secret = yield consulSecretCache.get(consul.SecurityTokenPath);
  let token = secret.consul.token;
  if (token === null) {
    token = undefined;
  }

  // if host is undefined, we connect to a random consul agent
  let host = (parameters.host !== undefined) ? parameters.host : _.sample(consul.Servers);

  let options = {
    host,
    port: consul.Port,
    defaults: {
      dc: consul.DataCenter,
      token,
    },
  };

  options.promisify = parameters.promisify;
  return options;
}

module.exports = co.wrap(getConsulClientOptions);
