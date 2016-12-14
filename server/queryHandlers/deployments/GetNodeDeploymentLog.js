/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let S3GetObjectRequest = require('modules/S3GetObjectRequest');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let sender = require('modules/sender');

function getNode(query) {
  let consulQuery = {
    name: 'GetTargetState',
    key: `deployments/${query.deploymentId}/nodes/${query.node}`,
    accountName: query.account,
    environment: query.environment,
    recurse: false,
  };

  return sender.sendQuery({ query: consulQuery }).then(node => {
    var s3Details = parseBucketAndPathFromS3Url(node.value.Log);
    return fetchS3Object(query.account, s3Details);
  });
}

function fetchS3Object(account, s3Details) {
  return amazonClientFactory.createS3Client(account).then((client) => {
    let s3Request = new S3GetObjectRequest(client, s3Details);
    return s3Request.execute()
      .then((result) => result.Body.toString());
  });
}

function parseBucketAndPathFromS3Url(url) {
  let r = /:\/\/(.*?)\..*?\/(.*)\?/g;
  let matches = r.exec(url);

  if (matches) {
    return {
      bucketName: matches[1],
      objectPath: matches[2],
    };
  }
}

module.exports = getNode;