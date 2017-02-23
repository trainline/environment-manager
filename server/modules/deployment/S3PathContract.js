/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = function S3PathContract(options) {
  this.bucket = options.bucket;
  this.key = options.key;
  this.getType = () => this.constructor.name;
};
