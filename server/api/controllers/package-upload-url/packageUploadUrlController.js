/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

/* Defines an Express route handler that accepts a request for a package upload URL for a combination of service, version and (optionally) environment.
 * Responds with a pre-signed S3 PUT URL valid for a fixed time period.
 */

/* eslint-disable import/no-extraneous-dependencies */
let environmentExistsRule = require('modules/validate/rule/environmentExists');
let log = require('modules/logger'); // eslint-disable import/no-extraneous-dependencies
let makeValidationFunction = require('modules/validate');
let masterAccountClient = require('modules/amazon-client/masterAccountClient'); // eslint-disable-line import/no-extraneous-dependencies
let s3PackageLocator = require('modules/s3PackageLocator');
let serviceExistsRule = require('modules/validate/rule/serviceExists');
let dynamicResponseCreator = require('api/controllers/package-upload-url/dynamicResponseCreator');
/* eslint-enable import/no-extraneous-dependencies */

let config = require('config');
let _ = require('lodash/fp');

const EM_PACKAGE_UPLOAD_TIMEOUT = config.get('EM_PACKAGES_UPLOAD_TIMEOUT') || 600;

let param = p => _.get(['swagger', 'params', p, 'value']);

function s3location(req) {
  let params = ['service', 'version', 'environment'];
  let extractParameterNameValuePair = name => [name, param(name)(req)];
  return _.flow(
  _.map(extractParameterNameValuePair),
  _.fromPairs,
  s3PackageLocator.s3PutLocation)(params);
}

function respondWithPreSignedUrl(request) {
  let params = _.assign(s3location(request))({
    Expires: EM_PACKAGE_UPLOAD_TIMEOUT,
    ContentType: 'application/zip'
  });
  return masterAccountClient.createS3Client().then(s3 =>
    new Promise((resolve, reject) => {
      s3.getSignedUrl('putObject', params, (err, url) => {
        if (err) {
          log.error(`Creation of pre-signed package upload URL failed: ${err.message}\n${err.stack}`);
          resolve(dynamicResponseCreator(request, 500));
        } else {
          resolve(dynamicResponseCreator(request, 200, url));
        }
      });
    }));
}

function packageDoesNotExist(req) {
  let params = s3location(req);

  return masterAccountClient.createS3Client()
  .then(client => client.headObject(params).promise())
  .then(
    rsp => ({ title: 'The package already exists.', detail: `${rsp.LastModified}`, status: '409' }),
    err => (err.statusCode === 404 ? undefined : Promise.reject(err))
  );
}

function serviceExists(req) {
  let service = param('service')(req);
  return serviceExistsRule(service).then(e => Object.assign(e, { status: '422' }));
}

function environmentExists(req) {
  let environment = param('environment')(req);
  return environmentExistsRule(environment).then(e => Object.assign(e, { status: '422' }));
}

function respondWithErrors(errors) {
  // Error format:  http://jsonapi.org/format/#errors
  let statuses = _.flow(_.map(_.get('status')), _.uniq)(errors);
  let status = (statuses.length === 1) ? statuses[0] : '422';
  return response => response.status(status).json({ errors });
}

function validate(validationRules) {
  let validationOptions = {
    rules: validationRules,
    validContinuation: respondWithPreSignedUrl,
    invalidContinuation: respondWithErrors
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
  getPackageUploadUrlByServiceVersionEnvironment
};
