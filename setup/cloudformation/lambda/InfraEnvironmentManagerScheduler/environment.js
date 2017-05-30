'use strict';

let co = require('co');

function getConfig(context, kms) {
  return co(function* () {
    let IGNORE_ASG_INSTANCES = hasValue(context.env.IGNORE_ASG_INSTANCES, 'true');
    let LIST_SKIPPED_INSTANCES = hasValue(context.env.LIST_SKIPPED_INSTANCES, 'true');
    let WHAT_IF = hasValue(context.env.WHAT_IF, 'true');
    let ERROR_ON_FAILURE = !hasValue(context.env.ERROR_ON_FAILURE, 'false');

    return {
      em: {
        host: context.env.EM_HOST,
        credentials: {
          username: context.env.EM_USERNAME,
          password: yield kms.decrypt(context.env.EM_PASSWORD)
        }
      },
      limitToEnvironment: context.env.LIMIT_TO_ENVIRONMENT,
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