/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let nconf = require('nconf');
let fs = require('fs');

const REQUIRED_VALUES = ['EM_AWS_REGION', 'EM_PACKAGES_BUCKET'];
const LOGGED_VALUES = ['EM_AWS_REGION', 'EM_AWS_RESOURCE_PREFIX', 'EM_AWS_S3_BUCKET', 'EM_PACKAGES_BUCKET', 'EM_PACKAGES_KEY_PREFIX'];
const APP_VERSION = require('./version').getVersion();

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
  'EM_AWS_S3_KEY': 'S3 Key value not set',
  'EM_PACKAGES_KEY_PREFIX': 'PACKAGES',
});

/**
 * Convenience values
 */
const isProduction = nconf.get('NODE_ENV') === 'production';
const useDevSources = nconf.get('DEV_SOURCES') === 'true';
const publicDir = isProduction || useDevSources ? './dist' : '../client';

nconf.set('IS_PRODUCTION', isProduction);
nconf.set('APP_VERSION', APP_VERSION);
nconf.set('PUBLIC_DIR', publicDir);

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
