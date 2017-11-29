/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let base64 = require('../../base64');
let createLinuxUserData = require('./userData/linux-user-data');
let createWindowsUserData = require('./userData/windows-user-data');

function isNonEmptyString(maybeStr) {
  return maybeStr !== undefined
    && maybeStr !== null
    && typeof maybeStr === 'string'
    && maybeStr !== '';
}

function mapStr(fn, maybeStr) {
  return isNonEmptyString(maybeStr)
    ? fn(maybeStr)
    : '';
}

module.exports = {
  buildLinuxUserData(userData) {
    assert(userData, 'Expected \'userData\' argument not to be null');
    let args = Object.assign({}, userData, { PuppetRole: mapStr(x => `-r ${x}`, userData.PuppetRole) });
    return Promise.resolve(base64.encode(createLinuxUserData(args)));
  },
  buildWindowsUserData(userData) {
    assert(userData, 'Expected \'userData\' argument not to be null');
    return Promise.resolve(base64.encode(createWindowsUserData(userData)));
  }
};
