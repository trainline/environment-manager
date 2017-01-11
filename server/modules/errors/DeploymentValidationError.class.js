/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let BaseError = require('./BaseError.class');

module.exports = class DeploymentValidationError extends BaseError {

  constructor(message, innerError) {
    super();
    this.name = this.constructor.name;
    this.message = message;
    this.innerError = innerError;

    Error.captureStackTrace(this, this.constructor);
  }

};
