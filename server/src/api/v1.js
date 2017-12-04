/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const swaggerTools = require('swagger-tools');
const config = require('../config');
const swaggerAuthorizer = require('../modules/express-middleware/swaggerAuthorizerMiddleware');
const swaggerNewRelic = require('../modules/express-middleware/swaggerNewRelicMiddleware');
const defaultErrorHandler = require('./error-handler/defaultErrorHandler');
const apiSpec = require('./swagger-doc');
const controllers = require('./controllers');

const NODE_ENV = process.env.NODE_ENV;
const API_BASE_PATH = apiSpec.basePath;

if (config.get('IS_PRODUCTION') === false) {
  apiSpec.host = 'localhost:8080';
  apiSpec.schemes = ['http'];
}

let swaggerOptions = { controllers: controllers() };

function setup() {
  return new Promise((resolve, reject) => {
    try {
      swaggerTools.initializeMiddleware(apiSpec, ({ swaggerMetadata, swaggerValidator, swaggerRouter, swaggerUi }) => {
        let result = {
          swaggerAuthorizer: swaggerAuthorizer(),
          swaggerBasePath: API_BASE_PATH,
          swaggerErrorHandler: defaultErrorHandler,
          swaggerMetadata: swaggerMetadata(),
          swaggerRouter: swaggerRouter(swaggerOptions),
          swaggerUi: swaggerUi(),
          swaggerValidator: swaggerValidator({ validateResponse: NODE_ENV === 'development' }),
          swaggerNewRelic
        };
        resolve(Object.freeze(result));
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = setup;
