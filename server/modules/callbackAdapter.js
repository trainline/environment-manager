/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

// TODO(filip): replace this with proper error handling middleware

function getStatusCode(error) {
  if (error.name !== undefined) {
    switch (error.name.replace('.class', '')) {
      case 'AutoScalingGroupNotFoundError':
      case 'ImageNotFoundError':
      case 'InstanceNotFoundError':
      case 'InstanceProfileNotFoundError':
      case 'ResourceNotFoundError':
      case 'KeyPairNotFoundError':
      case 'DynamoItemNotFoundError':
        return 404;
      case 'DynamoConcurrencyError':
      case 'DynamoConditionCheckError':
      case 'DynamoItemAlreadyExistsError':
      case 'InvalidItemSchemaError':
      case 'InvalidOperationError':
      case 'DeploymentValidationError':
      case 'InvalidContractError':
        return 400;
      case 'InconsistentSlicesStatusError':
        return 409;
      case 'InvalidCredentialsError':
        return 401;
      default:
        return 500;
    }
  }
  return 500;
}

function callbackToExpress(req, res) {
  return function (error, data) {
    // Everything ok!
    if (!error) return res.send(data);

    var statusCode = getStatusCode(error);
    var message = error.toString();

    res.status(statusCode);
    res.send(message);
  };
}

function promiseToExpress(req, res) {
  let callback = callbackToExpress(req, res);
  return function (promise) {
    promise.then((result) => callback(null, result), (err) => callback(err));
  }
} 

module.exports = {
  callbackToExpress,
  promiseToExpress,
};
