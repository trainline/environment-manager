/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { assign, omit } = require('lodash/fp');
let environments = require('modules/data-access/configEnvironments');
let environmentTypes = require('modules/data-access/configEnvironmentTypes');

function getEnvironmentType(environmentName) {
  let rejectIfNotFound = msg => obj => (obj !== null ? Promise.resolve(obj) : Promise.reject(new Error(msg)));
  return environments.get({ EnvironmentName: environmentName })
    .then(rejectIfNotFound(`Environment not found: ${environmentName}`))
    .then(({ Value: { EnvironmentType } }) => environmentTypes.get({ EnvironmentType })
      .then(rejectIfNotFound(`Environment Type not found: ${EnvironmentType}`)));
}

function convertToOldModel(model) {
  return omit(['AccountId', 'LoadBalancerGroup'])(model);
}

function convertToNewModel(model) {
  return Promise.resolve(model)
  .then(({ EnvironmentName }) => getEnvironmentType(EnvironmentName))
  .then(environmentType => assign({
    AccountId: environmentType.Value.AWSAccountNumber,
    LoadBalancerGroup: environmentType.EnvironmentType
  })(model));
}

module.exports = {
  convertToOldModel,
  convertToNewModel
};
