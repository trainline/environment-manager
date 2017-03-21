/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');

let HealthCheckResults = require('../resultCodes');
let UserSessionStore = require('modules/userSessionStore');

function getResult(status) {
  if (status === 'wait' || status === 'ready') {
    return { result: HealthCheckResults.SUCCESS };
  }
  
  return {
    result: HealthCheckResults.FAIL,
    reason: `Redis connection status is '${status}'`
  };
}

module.exports = {
  url: '/redis',
  run: () => {
    return co(function* () {
      let sessionStore = yield UserSessionStore.get();
      return getResult(sessionStore.status());
    });
  }
};
