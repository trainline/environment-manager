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

const EM_PACKAGES_BUCKET = config.get('EM_PACKAGES_BUCKET');
const EM_PACKAGES_KEY_PREFIX = config.get('EM_PACKAGES_KEY_PREFIX');
const EM_PACKAGE_UPLOAD_TIMEOUT = config.get('EM_PACKAGES_UPLOAD_TIMEOUT') || 600;

let param = p => _.get(['swagger', 'params', p, 'value']);

function key(req) {
  let params = ['service', 'version', 'environment'];
  let getValue = p => param(p)(req);
  let dynamicParts = params.map(getValue).filter(x => x !== undefined);
  let keyPathParts = [
    EM_PACKAGES_KEY_PREFIX,
    dynamicParts,
    `${dynamicParts.join('-')}.zip`,
  ];
  return _.flow(_.flatten, _.filter(x => x !== undefined), _.join('/'))(keyPathParts);
}

function respondWithPreSignedUrl(request) {
  let params = {
    Bucket: EM_PACKAGES_BUCKET,
    Key: key(request),
    Expires: EM_PACKAGE_UPLOAD_TIMEOUT,
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

function packageDoesNotExist(req) {
  let params = {
    Bucket: EM_PACKAGES_BUCKET,
    Key: key(req),
  };

  return masterAccountClient.createS3Client()
  .then(client => client.headObject(params).promise())
  .then(
    rsp => ({ title: 'The package already exists.', detail: `${rsp.LastModified}` }),
    err => (err.statusCode === 404 ? undefined : Promise.reject(err))
  );
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

function getPackageUploadUrlByServiceVersion(request, response, next) {
  validate([packageDoesNotExist, serviceExists])(request).then(send => send(response)).catch(next);
}

function getPackageUploadUrlByServiceVersionEnvironment(request, response, next) {
  validate([packageDoesNotExist, serviceExists, environmentExists])(request).then(send => send(response)).catch(next);
}

module.exports = {
  getPackageUploadUrlByServiceVersion,
  getPackageUploadUrlByServiceVersionEnvironment,
};
