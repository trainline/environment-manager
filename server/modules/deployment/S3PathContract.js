/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assertContract = require('modules/assertContract');

module.exports = function S3PathContract(options) {

  assertContract(options, 'S3PathContract', {
    properties: {
      bucket: { type: String, empty: false },
      key: { type: String, empty: false },
    },
  });

  this.bucket = options.bucket;
  this.key = options.key;

  this.getType = () => this.constructor.name;

};
