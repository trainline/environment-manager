/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const swaggerTools = require('swagger-tools');
const fs = require('fs');
const config = require('../config');
const path = require('path');
const swaggerAuthorizer = require('../modules/express-middleware/swaggerAuthorizerMiddleware');
const swaggerNewRelic = require('../modules/express-middleware/swaggerNewRelicMiddleware');
const defaultErrorHandler = require('./error-handler/defaultErrorHandler');
const apiSpec = require('./swagger-doc');

const NODE_ENV = process.env.NODE_ENV;
const API_BASE_PATH = apiSpec.basePath;

if (config.get('IS_PRODUCTION') === false) {
  apiSpec.host = 'localhost:8080';
  apiSpec.schemes = ['http'];
}

function getControllerDirectories(root) {
  let controllerNames = {};
  function loop(dir) {
    let fsEntries = fs.readdirSync(path.resolve(dir)).map((name) => {
      let fullname = path.resolve(dir, name);
      let stat = fs.statSync(fullname);
      return {
        fullname,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile()
      };
    });

    let dirs = fsEntries.filter(f => f.isDirectory).map(f => f.fullname);
    let files = fsEntries.filter(f => f.isFile).map(f => f.fullname);

    if (files.length > 0 && dirs.length > 0) {
      // eslint-disable-next-line max-len
      throw new Error(`Controller directories must contain either controller files or subdirectories but "${dir}" contains both.`);
    }

    files.forEach((f) => {
      let basename = path.basename(f);
      if (controllerNames[basename]) {
        // eslint-disable-next-line max-len
        throw new Error(`Controller names must be unique but "${basename}" was found at "${f}" and at "${controllerNames[basename]}".`);
      } else {
        controllerNames[basename] = f;
      }
    });

    if (dirs.length === 0) {
      return [dir];
    }
    return Array.prototype.concat.apply([], dirs.map(d => loop(d)));
  }
  return loop(root);
}

let swaggerOptions = {
  controllers: getControllerDirectories(path.resolve(__dirname, 'controllers'))
};

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
