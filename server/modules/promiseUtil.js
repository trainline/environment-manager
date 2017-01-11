/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');

function transformToCallbackLast(fn, context) {
  return function (...args) {
    let lastIndex = args.length - 1;
    let fixedArgs = args.slice(lastIndex, args.length).concat(args.slice(0, lastIndex));
    return fn.apply(context, fixedArgs);
  };
}

module.exports = {
  // That's some high level hackery to help with "reverse NodeJS callback" pattern
  // ie. functions like function(callback, param1, param2, ...)
  reversePromisify: (fn, params) => {
    let context;
    if (params !== undefined && params.context !== undefined) {
      context = params.context;
    }

    return Promise.promisify(transformToCallbackLast(fn, context), { context });
  },
};
