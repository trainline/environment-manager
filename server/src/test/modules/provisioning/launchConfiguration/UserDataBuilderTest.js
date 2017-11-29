/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { Buffer } = require('buffer');
require('should');
let sut = require('../../../../modules/provisioning/launchConfiguration/UserDataBuilder');

function base64ToUtf8(str) {
  return Buffer.from(str, 'base64').toString('utf-8');
}

describe('UserDataBuilder: ', () => {
  it('gets encoded windows user data', () => {
    let userData = { Value: 100 };
    return sut.buildWindowsUserData(userData)
      .then(base64ToUtf8)
      .should.finally.match(/Powershell.exe/);
  });

  it('gets encoded linux user data', () => {
    let userData = { Value: 100, PuppetRole: '' };
    return sut.buildLinuxUserData(userData)
      .then(base64ToUtf8)
      .should.finally.match(/#!\/bin\/bash/);
  });
});
