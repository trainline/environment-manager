/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let nconf = require('nconf');
const REQUIRED_VALUES = ['EM_AWS_REGION'];
const LOGGED_VALUES = ['EM_AWS_REGION', 'EM_AWS_RESOURCE_PREFIX', 'EM_AWS_S3_BUCKET'];
let fs = require('fs');
let appVersion = require('package.json').version;

/**
 * ENV is default but allow argument overrides
 */
nconf.env().argv();
nconf.use('memory');

/**
 * If an `EM_PROFILE` value is set, override values with that profile
 */
const profileOverride = nconf.get('EM_PROFILE');
if (profileOverride !== undefined) {
  if (fs.existsSync(profileOverride) === false) {
    throw Error(`File EM_PROFILE=${profileOverride} doesn't exist.`);
  }
  nconf.file(profileOverride)
}

/**
 * Defaults if not previously set via ENV, args or profile
 */
nconf.defaults({
  'EM_AWS_RESOURCE_PREFIX': '',
  'EM_LOG_LEVEL': 'Debug',
  'EM_AWS_S3_BUCKET': 'S3 Bucket value not set',
  'EM_AWS_S3_KEY': 'S3 Key value not set'
});

/**
 * Convenience boolean for NODE_ENV comparisons
 */
nconf.set('IS_PRODUCTION', nconf.get('NODE_ENV') === 'production');
nconf.set('APP_VERSION', appVersion);

/**
 * Ensure required values are set
 */
REQUIRED_VALUES.filter(v => nconf.get(v) === undefined).forEach(missing => {
  throw new Error(`${missing} value is not set.`);
});

/**
 * Set user namespaced config value
 */
function userSet(key, value) {
  return nconf.set(`user:${key}`, value);
}

/**
 * Get user namespaced config value
 */
function userGet(key) {
  return nconf.get(`user:${key}`);
}

module.exports = {
  logBootstrapValues: () => {
    LOGGED_VALUES.forEach(key => {
      console.log(`${key}=${nconf.get(key)}`);
    });
  },
  get: nconf.get.bind(nconf),
  setUserValue: userSet,
  getUserValue: userGet
};
