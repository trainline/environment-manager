/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var stringifyError = function (error, detailed) {
  return detailed ? error.stack + "/n" : `${error.name}: ${error.message}`;
};

class BaseError extends Error {
  
  constructor (message, innerError) {
    super();
    this.name = this.constructor.name;
    this.message = message;
    this.innerError = innerError;
    Error.captureStackTrace(this, this.constructor);
  }

  toString (detailed) {
    let errors = [];
    let currentError = this;

    while (currentError) {
      errors.push(currentError);
      currentError = currentError.innerError;
    }
    return errors.map(error => stringifyError(error, detailed)).join("/n");
  }
}

Error.prototype.toString = function (detailed) {
  return stringifyError(this, detailed);
};

module.exports = BaseError;