/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let recurseValidator = require('./recurseValidator');
const BASE_PATH = '/:account/consul/kv/';

function getKeyFromRequest(request) {
  let key = request.params['0'];
  return key;
}

module.exports = [

  route.get(`${BASE_PATH}*`)
  .whenUserCan('view')
  .withDocs({ disableDocs: true })
  .do((request, response) => {
    let recurse = recurseValidator.getRecurseValue(request.query.recurse);
    let query = {
      name: 'GetTargetState',
      environment: getEnvironmentFrom(request),
      key: getKeyFromRequest(request),
      recurse,
    };

    send.query(query, request, response);
  }),

];

function getEnvironmentFrom(req) {
  let environment = req.query.environment;
  if (environment) {
    return environment;
  }

  throw new Error('the \'environment\' query string parameter is required.');
}
