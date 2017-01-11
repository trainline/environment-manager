/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let Instance = require('models/Instance');
let InstanceNotFoundError = require('modules/errors/InstanceNotFoundError.class');

function InstanceResource(client) {

  function flatInstances(data) {
    let instances = reservation => reservation.Instances;
    return _(data.Reservations).map(instances).compact().flatten().value();
  }

  function buildRequest(query) {
    if(!query) return {};

    // {a:1, b:2} => [{Name:'a', Values:[1]}, {Name:'b', Values:[2]}]
    let Filters = _.toPairs(query).map(q => ({ Name: q[0], Values: _.castArray(q[1]) }));
    return { Filters };
  }

  this.all = function (parameters) {
    let request = buildRequest(parameters.filter);
    let instances = [];

    function query() {

      return client.describeInstances(request).promise().then(data => {
        instances = instances.concat(flatInstances(data));

        if(!data.NextToken) {
          return _.map(instances, (state) => new Instance(state));
        }

        // Scan from next index
        request.NextToken = data.NextToken
        return query(client);
      });
    };

    return query(client);
  };

  this.setTag = function (parameters) {
    let request = {
      Resources: parameters.instanceIds,
      Tags: [
        {
          Key: parameters.tagKey,
          Value: parameters.tagValue
        }
      ]
    };

    return client.createTags(request).promise().catch(error => {
      throw standardifyError(error);
    });
  };

  function standardifyError(error) {
    if (!error) return null;

    return new InstanceNotFoundError(error.message);
  }
};

module.exports = {
  canCreate: (resourceDescriptor) =>
    resourceDescriptor.type.toLowerCase() === 'ec2/instance',

  create: (resourceDescriptor, parameters) =>
    amazonClientFactory.createEC2Client(parameters.accountName).then(client => new InstanceResource(client)),

};
