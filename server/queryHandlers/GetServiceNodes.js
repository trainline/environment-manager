/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');

module.exports = function GetServiceNodesQueryHandler(query) {
  let sender = require('modules/sender');

  return sender.sendQuery({
    query: {
      name: 'GetService',
      accountName: query.accountName,
      environment: query.environment,
      serviceName: query.serviceName,
    },
  }).then((nodes) => {
    return nodes.map((node) => {
      let result = _.clone(node);
      result.ServiceTags = tagsToMap(node.ServiceTags);
      return result;
    });
  });
};

function tagsToMap(tags) {
  let map = {};
  tags.forEach((tag) => {
    let parts = tag.split(':');
    map[parts[0]] = parts[1];
  });

  return map;
}
