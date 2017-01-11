/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let async = require('async');
let S3GetObjectRequest = require('modules/S3GetObjectRequest');
let config = require('config');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let sslComponentsCache = null;

module.exports = function SSLComponentsRepository() {
  let sslComponentsRepositoryConfiguration = new (require('modules/sslComponentsRepositoryConfiguration'))();

  this.get = function () {
    return new Promise((resolve, reject) => {
      if (sslComponentsCache) {
        resolve(sslComponentsCache);
      } else {
        loadSSLComponentsFromS3((error, sslComponents) => {
          if (error) reject(error);
          else {
            sslComponentsCache = sslComponents;
            resolve(sslComponents);
          }
        });
      }
    });
  };

  function loadSSLComponentsFromS3(mainCallback) {
    // TODO(filip): get rid of async
    const masterAccountName = config.getUserValue('masterAccountName');

    async.waterfall([
      // Creates a new instance of S3 client
      (callback) => {
        amazonClientFactory.createS3Client(masterAccountName).then(
          client => callback(null, client),
          error => callback(error)
        );
      },

      // SSL private key and certificate files are stored on S3.
      // Following function creates a couple of request in order to download
      // these two S3 objects.
      (client, callback) => {
        let privateKeyRequestParameters = {
          bucketName: sslComponentsRepositoryConfiguration.getBucketName(),
          objectPath: sslComponentsRepositoryConfiguration.getPrivateKeyObjectPath()
        };

        let privateKeyRequest = new S3GetObjectRequest(client, privateKeyRequestParameters);

        let certificateRequestParameters = {
          bucketName: sslComponentsRepositoryConfiguration.getBucketName(),
          objectPath: sslComponentsRepositoryConfiguration.getCertificateObjectPath()
        };

        let certificateRequest = new S3GetObjectRequest(client, certificateRequestParameters);

        async.parallel({
          privateKeyS3Object: privateKeyRequest.execute,
          certificateS3Object: certificateRequest.execute
        }, callback);
      },

      // Previous function returns a couple of S3 objects. The following one
      // gets their content.
      (response, callback) => {
        callback(null, {
          privateKey: response.privateKeyS3Object.Body.toString('utf8'),
          certificate: response.certificateS3Object.Body.toString('utf8')
        });
      }
    ], mainCallback);
  }
};
