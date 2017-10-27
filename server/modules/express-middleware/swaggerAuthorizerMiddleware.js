/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let authorization = require('../authorization');

function authorize(req, res, next) {
  if (req.swagger === undefined) {
    next();
    return;
  }

  // We need to rewrite this for authorizers to work with swagger
  _.each(req.swagger.params, (param, key) => {
    req.params[key] = param.value;
  });

  let authorizerName = req.swagger.operation['x-authorizer'] || 'simple';

  if (authorizerName !== 'allow-anonymous') {
    let authorizer = require(`modules/authorizers/${authorizerName}`);
    authorization(authorizer, req, res, next);
  } else {
    next();
  }
}

module.exports = () => authorize;
