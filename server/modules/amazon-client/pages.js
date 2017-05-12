/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

/**
 * Analogue of Array.reduce that iterates over the pages of an AWS Request object.
 *
 * @param {function} callback - (accumulator, page) -> accumulator.
 * @param {any} initialValue - initial value of accumulator.
 * @param {object} awsRequest - an instance of AWS.Request.
 *   See http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Request.html#eachPage
 * @returns {any} - returns the value of accumulator after applying callback to the
 *   last page.
 */
function reduce(callback, initialValue, awsRequest) {
  if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  let accumulator = initialValue;
  return new Promise((resolve, reject) => {
    awsRequest.eachPage((error, data) => {
      if (error) {
        reject(error);
        return false;
      } else if (data === null) {
        resolve(accumulator);
        return false;
      } else {
        accumulator = callback(accumulator, data);
        return true;
      }
    });
  });
}

/**
 * Flattens the result pages of an AWS Request object into a single array.
 *
 * @param {function} callback - page -> items. Selects the items that should be
 *   returned from the page.
 * @param {object} awsRequest - an instance of AWS.Request.
 *   See http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Request.html#eachPage
 * @returns {array} - returns the value of accumulator after applying callback to the
 *   last page.
 */
function flatten(callback, awsRequest) {
  if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  function extractAndConcatItems(accumulator, page) {
    let items = callback(page);
    if (Array.isArray(items)) {
      items.forEach(item => accumulator.push(item));
    } else {
      accumulator.push(items);
    }
    return accumulator;
  }

  return reduce(extractAndConcatItems, [], awsRequest);
}

module.exports = {
  reduce,
  flatten
};
