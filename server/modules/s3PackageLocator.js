/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

/* Defines functions to locate a package in S3 given its name, version and (optionally) environment
 */

let config = require('config');
let fp = require('lodash/fp');
let masterAccountClient = require('modules/amazon-client/masterAccountClient');
let s3Url = require('modules/amazon-client/s3Url');

const EM_PACKAGES_BUCKET = config.get('EM_PACKAGES_BUCKET');
const EM_PACKAGES_KEY_PREFIX = config.get('EM_PACKAGES_KEY_PREFIX');

function key({ environment, service, version }) {
  let dynamicParts = [service, version, environment].filter(x => x !== undefined);
  let keyPathParts = [
    EM_PACKAGES_KEY_PREFIX,
    dynamicParts,
    `${dynamicParts.join('-')}.zip`,
  ];
  return fp.flow(fp.flatten, fp.filter(x => x !== undefined), fp.join('/'))(keyPathParts);
}

/**
 * Format an object as an S3 URL.
 * @param {Object} packageRef - an object with string properties service, version and (optionally) environment.
 * @returns {Object} an S3 location with string properties Bucket and Key.
 */
function exactLocation(packageRef) {
  return {
    Bucket: EM_PACKAGES_BUCKET,
    Key: key(packageRef),
  };
}

/**
 * Format an object as an S3 URL.
 * @param {Object} packageRef - an object with string properties service, version and environment.
 * @returns {Array} An array of S3 locations, each with string properties Bucket and Key.
 */
function s3GetLocations(packageRef) {
  let matches = [
    x => x,
    fp.omit('environment'),
  ];
  return fp.flow(fp.map(x => exactLocation(x(packageRef))), fp.uniq)(matches);
}

function findDownloadUrl(packageRef) {
  let locations = s3GetLocations(packageRef);
  return masterAccountClient.createS3Client()
    .then((s3) => {
      function getUrlIfObjectExists(location) {
        let rq = s3.headObject(location);
        return rq.promise().then(
          () => s3Url.format(location, rq.httpRequest.region),
          error => (error.statusCode === 404 ? Promise.resolve() : Promise.reject(error))
        );
      }

      return Promise.all(locations.map(getUrlIfObjectExists))
        .then(results => results.find(x => x));
    });
}

module.exports = {
  findDownloadUrl,
  s3GetLocations,
  s3PutLocation: exactLocation,
};
