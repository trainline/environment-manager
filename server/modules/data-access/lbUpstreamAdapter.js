/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

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
  return {
    Audit: model.Audit,
    key: model.Key,
    Value: {
      EnvironmentName: model.Environment,
      Hosts: model.Hosts,
      LoadBalancingMethod: model.LoadBalancingMethod,
      PersistenceMethod: model.PersistenceMethod,
      SchemaVersion: model.SchemaVersion,
      ServiceName: model.Service,
      SlowStart: model.SlowStart,
      UpStreamKeepalives: model.UpStreamKeepalives,
      UpstreamName: model.Upstream,
      ZoneSize: model.ZoneSize
    }
  };
}

function convertToNewModel(model) {
  return Promise.resolve()
    .then(() => {
      if (model.__Deleted) { // eslint-disable-line no-underscore-dangle
        return {
          __Deleted: true,
          Audit: model.Audit,
          Key: model.key
        };
      } else {
        let environmentName = model.Value.EnvironmentName;
        return getEnvironmentType(environmentName)
          .then(environmentType => ({
            AccountId: environmentType.Value.AWSAccountNumber,
            Audit: model.Audit,
            Environment: environmentName,
            Hosts: model.Value.Hosts,
            Key: model.key,
            LoadBalancerGroup: environmentType.EnvironmentType,
            LoadBalancingMethod: model.Value.LoadBalancingMethod,
            PersistenceMethod: model.Value.PersistenceMethod,
            SchemaVersion: model.Value.SchemaVersion,
            Service: model.Value.ServiceName,
            SlowStart: model.Value.SlowStart,
            Upstream: model.Value.UpstreamName,
            UpStreamKeepalives: model.Value.UpStreamKeepalives,
            ZoneSize: model.Value.ZoneSize
          }));
      }
    });
}

module.exports = {
  convertToOldModel,
  convertToNewModel
};
