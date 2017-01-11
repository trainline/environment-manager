/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

/**
 * @typedef {Object} Otions
 * @property {Rule[]} rules - an array of validation functions
 * @property {Function} validContinuation - continuation for the valid case
 * @property {Function} invalidContinuation - continuation for the invalid case
 */

 /**
 * @typedef {Function} Rule
 * @param {Any} item - the item to be validated.
 * @returns {Array<Any>} errors - validation errors.
 */

let _ = require('lodash/fp');

/**
 * Create a validation function.
 * @param {Options} - the validation rules and continuations.
 * @returns {Function} - a function that takes the item to validate as its argument and returns the result of the valid or invalid continuation as appropriate.
 */
function createValidationFunction(options) {
  let rules = options.rules;
  let validContinuation = options.validContinuation;
  let invalidContinuation = options.invalidContinuation;
  return (argument) => {
    let errorsPromise = Promise.all(rules.map(rule => Promise.resolve().then(() => rule(argument)))).then(_.flow(_.filter(x => x !== undefined), _.flatten));
    return errorsPromise.then(errors => (errors.length === 0 ? validContinuation(argument) : invalidContinuation(errors)));
  };
}

module.exports = createValidationFunction;
