/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const VERSION_INFO = 'version.txt';

let fs = require('fs');
let packageInfo = require('package.json');

function getVersion() {
  if (fs.existsSync(VERSION_INFO)) {
    return fs.readFileSync(VERSION_INFO, 'utf-8').trim();
  } else {
    return `${packageInfo.version}-DEV`;
  }
}

module.exports = {
  getVersion: getVersion
};
