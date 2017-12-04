/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
const nginxUpstreamsResourceFactory = require('../modules/resourceFactories/nginxUpstreamsResourceFactory');

function* handler(query) {
  // Create an instance of the Nginx resource
  let resource = yield nginxUpstreamsResourceFactory.create(undefined, {});

  // Scan resource items
  const params = { instanceDomainName: query.instanceDomainName };

  return resource.all(params);
}

module.exports = co.wrap(handler);
