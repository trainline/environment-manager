/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let path = require('path');
let DmPacker = require('modules/dm-packer/DmPacker');
let AWS = require('aws-sdk');

let deploymentMap = {
  id: 'TTL.DeploymentMap.PricingService.Cluster.c50.Servic',
  version:'0.2.5-alpha2dm31'
};

var destination = {
  bucket: 'ttl-codedeploy-revisions-sandbox', // Should look this up in environment config, using environment name as key.
  key: `DummyApplication/Sandbox/${deploymentMap.id}-${deploymentMap.version}.zip`
};

function test() {

  var target = new DmPacker();
  var s3client = new AWS.S3();

  return target.buildCodeDeployPackage(deploymentMap)
    .then(archive => target.uploadCodeDeployPackage(destination, archive, s3client));
}

module.exports = test;

