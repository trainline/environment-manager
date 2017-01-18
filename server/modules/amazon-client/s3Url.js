/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

/**
 * @typedef {Object} S3Location
 * @property {string} endpoint
 * @property {string} Bucket
 * @property {string} Key
 * @property {string|undefined} VersionId
 */

'use strict';

const AWS = require('aws-sdk');
const _ = require('lodash/fp');

/**
 * Parse a string as an S3 object URL.
 * @param {string} url - the URL that refers to the S3 object.
 * @returns {S3Location|undefined} The parsed S3 location.
 */
function parse(url) {
  function parseBucketInPath() {
    let regex = /^(https?:\/\/s3[^\/\.]+\.amazonaws\.com)\/([^\/]+)\/([^\?]+)(?:\?versionId=([^&]+))?$/;
    let t = regex.exec(url);
    if (t === null) {
      return undefined;
    }
    return {
      endpoint: t[1],
      Bucket: t[2],
      Key: t[3],
      VersionId: t[4]
    };
  }

  function parseBucketInHostname() {
    let regex = /^(https?:\/\/)([^\.]+)\.(s3[^\/\.]+\.amazonaws\.com)\/([^\?]+)(?:\?versionId=([^&]+))?$/;
    let t = regex.exec(url);
    if (t === null) {
      return undefined;
    }
    return {
      endpoint: t[1] + t[3],
      Bucket: t[2],
      Key: t[4],
      VersionId: t[5]
    };
  }

  return parseBucketInPath() || parseBucketInHostname();
}

/**
 * Format an object as an S3 URL.
 * @param {string} s3location - an object with string properties Bucket, Key and (optionally) VersionId.
 * @returns {string} the URL that refers to the S3 object.
 */
function format(s3location, region) {
  let s3 = new AWS.S3({ region });
  let versionId = x => (x.VersionId ? `?versionId=${x.VersionId}` : '');
  return `${s3.endpoint.href}${s3location.Bucket}/${s3location.Key}${versionId(s3location)}`;
}

/**
 * Get the object at the S3 URL.
 * @param {string} url - the URL that refers to the S3 object.
 * @param {Object} options - additional options to the AWS.S3 constructor.
 * @returns {ReadableStream} A readable stream of the object data.
 */
function getObject(url, options) {
  let params = parse(url);
  if (params === undefined) {
    throw new Error(`The URL is not a valid S3 object or object version URL: ${url}`);
  }
  let opts = Object.assign({}, options || {}, _.pick(['endpoint'])(params));
  let getObjectArgs = Object.assign({}, _.compose(_.pick(['Bucket', 'Key', 'VersionId']), _.omitBy(_.isUndefined))(params));
  let request = new AWS.S3(opts).getObject(getObjectArgs);
  return request.createReadStream();
}

module.exports = {
  format,
  getObject,
  parse
};
