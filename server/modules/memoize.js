/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let deepFreeze = require('deep-freeze');

function isPromise(obj) {
  return obj && obj.then && typeof obj.then === 'function';
}

function deepFreezeIfObj(obj) {
  let t = typeof obj;
  return ((t === 'object' || t === 'function') && t !== null)
    ? deepFreeze(obj)
    : obj;
}

function memoize(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Can only memoize a function');
  }

  let memo = new Map();
  return (...args) => {
    let key = JSON.stringify(args);
    if (!memo.has(key)) {
      let result = fn(...args);
      if (isPromise(result)) {
        memo.set(key, result.then(deepFreezeIfObj));
      } else {
        memo.set(key, deepFreezeIfObj(result));
      }
    }
    return memo.get(key);
  };
}

module.exports = memoize;
