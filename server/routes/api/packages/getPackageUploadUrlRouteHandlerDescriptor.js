/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

/* Defines an Express route handler that accepts a request for a package upload URL for a combination of service, version and (optionally) environment.
 * Responds with a pre-signed S3 PUT URL valid for a fixed time period.
 */

/* eslint-disable import/no-extraneous-dependencies */
const environmentExistsRule = require('modules/validate/rule/environmentExists');
const log = require('modules/logger'); // eslint-disable import/no-extraneous-dependencies
const makeValidationFunction = require('modules/validate');
const masterAccountClient = require('modules/amazon-client/masterAccountClient'); // eslint-disable-line import/no-extraneous-dependencies
const route = require('modules/helpers/route'); // eslint-disable-line import/no-extraneous-dependencies
const serviceExistsRule = require('modules/validate/rule/serviceExists');
/* eslint-enable import/no-extraneous-dependencies */

const config = require('config');
const _ = require('lodash/fp');

let param = p => _.get(['params', p]);

function key(req) {
  let params = ['service', 'version', 'environment'];
  let getValue = p => param(p)(req);
  return params.map(getValue).filter(x => x !== undefined).concat(['package.zip']).join('/');
}

function respondWithPreSignedUrl(request) {
  let params = {
    Bucket: config.get('PACKAGES_BUCKET'),
    Key: key(request),
    Expires: 300,
    ContentType: 'application/zip',
  };
  return masterAccountClient.createS3Client().then(s3 =>
    new Promise((resolve, reject) => {
      s3.getSignedUrl('putObject', params, (err, url) => {
        if (err) {
          log.error(`Creation of pre-signed package upload URL failed: ${err.message}\n${err.stack}`);
          resolve(response => response.status(500).send());
        } else {
          resolve(response => response.status(200).send(url));
        }
      });
    }));
}

function serviceExists(req) {
  let service = param('service')(req);
  return serviceExistsRule(service);
}

function environmentExists(req) {
  let environment = param('environment')(req);
  return environmentExistsRule(environment);
}

function respondWithErrors(errors) {
  // Error format:  http://jsonapi.org/format/#errors
  return response => response.status(422).json({ errors });
}

function validate(validationRules) {
  let validationOptions = {
    rules: validationRules,
    validContinuation: respondWithPreSignedUrl,
    invalidContinuation: respondWithErrors,
  };
  return makeValidationFunction(validationOptions);
}

module.exports = [
  route.get('/package-upload-url/:service/:version/')
    .inOrderTo('Get a URL to which I can PUT a package')
    .withDocs({ description: 'Package', tags: ['Package'] })
    .do((request, response, next) => validate([serviceExists])(request).then(send => send(response)).catch(next)),
  route.get('/package-upload-url/:service/:version/:environment')
    .inOrderTo('Get a URL to which I can PUT a package')
    .withDocs({ description: 'Package', tags: ['Package'] })
    .do((request, response, next) => validate([serviceExists, environmentExists])(request).then(send => send(response)).catch(next)),
];
