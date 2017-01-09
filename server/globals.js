/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
/* eslint-disable */

'use strict';
/**
 * TODO: Please kill this file with murder. Twice.
 */

Array.prototype.distinct = function (keySelector) {
  let result = [];
  let defaultSelector = item => item;
  let keySelector = keySelector || defaultSelector;

  for (let i = 0; i < this.length; i++) {
    let target = this[i];
    let key = keySelector(target);
    let exists = result.some(source => keySelector(source) === key);

    if (exists) continue;
    result.push(target);
  }

  return result;
};

