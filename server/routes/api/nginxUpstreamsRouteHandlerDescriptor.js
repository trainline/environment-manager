/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');

module.exports =
  route.get('/nginx/:fqdn')
  .withDocs({ disableDocs: true })
  .do((request, response) => {
    let query = {
      name: 'ScanNginxUpstreams',
      instanceDomainName: request.params.fqdn,
    };

    send.query(query, request, response);
  });
