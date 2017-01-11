/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
const LINUX_USER_DATA_TEMPLATE = 'linux-user-data';
const WINDOWS_USER_DATA_TEMPLATE = 'windows-user-data';
let renderer = require('modules/renderer');

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

renderer.register(LINUX_USER_DATA_TEMPLATE,
  `modules/provisioning/launchConfiguration/userData/${LINUX_USER_DATA_TEMPLATE}.txt`);

renderer.register(WINDOWS_USER_DATA_TEMPLATE,
  `modules/provisioning/launchConfiguration/userData/${WINDOWS_USER_DATA_TEMPLATE}.txt`);


function buildUserDataByName(userDataTemplateName, userData) {
  return new Promise((resolve) => {
    renderer.render(userDataTemplateName, userData, (content) => {
      let encodedContent = new Buffer(content).toString('base64');
      return resolve(encodedContent);
    });
  });
}

module.exports = {
  buildLinuxUserData(userData) {
    assert(userData, 'Expected \'userData\' argument not to be null');
    let args = Object.assign({}, userData, { PuppetRole: mapStr(x => `-r ${x}`, userData.PuppetRole) });
    return buildUserDataByName(LINUX_USER_DATA_TEMPLATE, args);
  },
  buildWindowsUserData(userData) {
    assert(userData, 'Expected \'userData\' argument not to be null');
    return buildUserDataByName(WINDOWS_USER_DATA_TEMPLATE, userData);
  },
  LINUX_USER_DATA_TEMPLATE,
  WINDOWS_USER_DATA_TEMPLATE
};
