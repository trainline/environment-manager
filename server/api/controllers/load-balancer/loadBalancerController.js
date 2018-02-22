/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let sender = require('../../../modules/sender');
let ScanNginxUpstreams = require('../../../queryHandlers/ScanNginxUpstreams');

/**
 * GET /load-balancer/{name}
 */
function getLoadBalancer(req, res, next) {
  const fqdn = req.swagger.params.id.value;

  let query = {
    name: 'ScanNginxUpstreams',
    instanceDomainName: fqdn
  };

  return sender.sendQuery(ScanNginxUpstreams, { query })
    .then(data => res.json(data))
    .catch(next);
}

module.exports = {
  getLoadBalancer
};
