/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var util = require('util');
var BaseError = require('./BaseError.class');

module.exports = function DynamoRequestError(message, innerError) {

  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);

};

util.inherits(module.exports, BaseError);
