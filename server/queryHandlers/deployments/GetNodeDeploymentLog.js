/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let S3GetObjectRequest = require('modules/S3GetObjectRequest');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let sender = require('modules/sender');

function getNode({ deploymentId, instanceId, accountName, environment }) {
  let query = {
    name: 'GetTargetState',
    key: `deployments/${deploymentId}/nodes/${instanceId}`,
    accountName,
    environment,
    recurse: false
  };

  return sender.sendQuery({ query }).then((node) => {
    let s3Details = parseBucketAndPathFromS3Url(node.value.Log);
    return fetchS3Object(accountName, s3Details);
  }, (error) => {
    if (error.message.match(/Key.*has not been found/)) {
      throw new Error(`The service deployment ${deploymentId} hasn\'t started on instance ${instanceId}.`);
    } else throw error;
  });
}

function fetchS3Object(account, s3Details) {
  return amazonClientFactory.createS3Client(account).then((client) => {
    let s3Request = new S3GetObjectRequest(client, s3Details);
    return s3Request.execute()
      .then(result => result.Body.toString());
  });
}

function parseBucketAndPathFromS3Url(url) {
  let r = /:\/\/(.*?)\..*?\/(.*)\?/g;
  let matches = r.exec(url);

  if (matches) {
    return {
      bucketName: matches[1],
      objectPath: matches[2]
    };
  } else {
    return null;
  }
}

module.exports = getNode;
