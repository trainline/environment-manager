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
