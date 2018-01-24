'use strict';

let _ = require('lodash');
let InstanceNotFoundError = require('../errors/InstanceNotFoundError.class');

function InstanceResource(client) {
  function flatInstances(data) {
    let instances = reservation => reservation.Instances;
    return _(data.Reservations).map(instances).compact().flatten().value();
  }

  function buildRequest(query) {
    if (!query) return {};

    // {a:1, b:2} => [{Name:'a', Values:[1]}, {Name:'b', Values:[2]}]
    let Filters = _.toPairs(query).map(q => ({ Name: q[0], Values: _.castArray(q[1]) }));
    return { Filters };
  }

  this.all = function (parameters) {
    let request = buildRequest(parameters.filter);
    let instances = [];

    function query() {
      return client.describeInstances(request)
        .promise()
        .then(handleData);

      function handleData(data) {
        instances = instances.concat(flatInstances(data));

        if (!data.NextToken) {
          return _.map(instances);
        }

        // Scan from next index
        request.NextToken = data.NextToken;
        return query(client);
      }
    }

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

    return client.createTags(request).promise().catch((error) => {
      throw standardifyError(error);
    });
  };

  function standardifyError(error) {
    if (!error) return null;

    return new InstanceNotFoundError(error.message);
  }
}

module.exports = InstanceResource;
