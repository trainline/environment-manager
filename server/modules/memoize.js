/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let lodash = require('lodash');

function memoize(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Can only memoize a function');
  }

  let memo = new Map();
  return (...args) => {
    let key = JSON.stringify(args);
    if (!memo.has(key)) {
      let result = fn(...args);
      memo.set(key, result);
    }
    return lodash.cloneDeep(memo.get(key));
  };
}

module.exports = memoize;
