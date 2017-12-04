/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function createRequest(parameters) {
  if (!parameters) return {};

  let request = {
    Filters: [
      { Name: 'vpc-id', Values: [parameters.vpcId] }
    ]
  };

  if (parameters.groupIds) {
    request.Filters.push({ Name: 'group-id', Values: parameters.groupIds });
  }

  if (parameters.groupNames) {
    request.Filters.push({ Name: 'tag-key', Values: ['Name'] });
    request.Filters.push({ Name: 'tag-value', Values: parameters.groupNames });
  }

  return request;
}

function SecurityGroupResource(client) {
  this.scan = function (parameters) {
    let request = createRequest(parameters);
    return client.describeSecurityGroups(request).promise().then(response => response.SecurityGroups);
  };
}

module.exports = SecurityGroupResource;
