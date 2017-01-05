/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let _ = require('lodash');
let Environment = require('models/Environment');
let sender = require('modules/sender');

function tagsToMap(tags) {
  let map = {};
  tags.forEach(tag => {
    let parts = tag.split(':');
    map[parts[0]] = parts[1];
  });

  return map;
}

function* GetServiceNodesQueryHandler(query) {
  const accountName = yield (yield Environment.getByName(query.environment)).getAccountName();

  return sender.sendQuery({
    query: {
      name: 'GetService',
      accountName,
      environment: query.environment,
      serviceName: query.serviceName,
    },
  }).then(nodes => {
    return nodes.map(node => {
      let result = _.clone(node);
      result.ServiceTags = tagsToMap(node.ServiceTags);
      return result;
    });
  });
}

module.exports = co.wrap(GetServiceNodesQueryHandler);
