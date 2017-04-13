'use strict';

let co = require('co');
let process = require('process');

function getConfig(kms) {
  return co(function* () {
    let IGNORE_ASG_INSTANCES = hasValue(process.env.IGNORE_ASG_INSTANCES, 'true');
    let LIST_SKIPPED_INSTANCES = hasValue(process.env.LIST_SKIPPED_INSTANCES, 'true');
    let WHAT_IF = hasValue(process.env.WHAT_IF, 'true');
    let ERROR_ON_FAILURE = !hasValue(process.env.ERROR_ON_FAILURE, 'false');

    return {
      em: {
        host: process.env.EM_HOST,
        credentials: {
          username: process.env.EM_USERNAME,
          password: yield kms.decrypt(process.env.EM_PASSWORD)
        }
      },
      limitToEnvironment: process.env.LIMIT_TO_ENVIRONMENT,
      ignoreASGInstances: IGNORE_ASG_INSTANCES,
      listSkippedInstances: LIST_SKIPPED_INSTANCES,
      whatIf: WHAT_IF,
      errorOnFailure: ERROR_ON_FAILURE
    };
  })
}

function hasValue(val, testVal) {
  return !!val && val.trim().toLowerCase() === testVal.trim().toLowerCase();
}

module.exports = { getConfig };