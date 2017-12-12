require("source-map-support").install();
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 144);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("co");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("lodash");

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let winston = __webpack_require__(149);
let AWS = __webpack_require__(29);
let config = __webpack_require__(5);
let fp = __webpack_require__(4);

const EM_LOG_LEVEL = config.get('EM_LOG_LEVEL').toLowerCase();
const IS_PROD = config.get('IS_PRODUCTION');
const IS_REMOTE_DEBUG = config.get('IS_REMOTE_DEBUG');

let transportOpts = { level: EM_LOG_LEVEL, showLevel: false };
if (IS_PROD) transportOpts.formatter = formatter;

function formatter(options) {
  let entry = {
    message: options.message,
    level: options.level,
    name: 'environment-manager',
    eventtype: fp.compose(fp.defaultTo('default'), fp.get(['meta', 'eventtype']))(options),
    releaseversion: process.env.RELEASE_VERSION || config.get('APP_VERSION'),
    meta: fp.compose(fp.omit('eventtype'), fp.get('meta'))(options)
  };
  return JSON.stringify(entry);
}

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)(transportOpts)
  ]
});

if (IS_PROD) {
  // Globally configure aws-sdk to log all activity.
  AWS.config.update({
    logger: {
      log: (level, message, meta) => logger.log(level, message, fp.assign({ eventtype: 'aws' })(meta))
    }
  });
}

logger.info(`Starting logger with log level ${EM_LOG_LEVEL}`);

if (IS_REMOTE_DEBUG) {
  /**
   * The remote debugger will *only* pick-up messages sent via console.{log|info|warn|error}
   * The Winston console transport currently uses process.stdout.write which will not work.
   * @see https://github.com/winstonjs/winston/issues/981
   */
  module.exports = console;
} else {
  module.exports = logger;
}



/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("assert");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("lodash/fp");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let nconf = __webpack_require__(146);
let fs = __webpack_require__(27);
let { getVersion } = __webpack_require__(147);

const REQUIRED_VALUES = ['EM_AWS_REGION', 'EM_PACKAGES_BUCKET'];
const LOGGED_VALUES = [...REQUIRED_VALUES, 'EM_AWS_RESOURCE_PREFIX', 'EM_AWS_S3_BUCKET', 'EM_PACKAGES_KEY_PREFIX'];

function init() {
  const APP_VERSION = getVersion();

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
    nconf.file(profileOverride);
  }

  /**
   * Defaults if not previously set via ENV, args or profile
   */
  nconf.defaults({
    EM_AWS_RESOURCE_PREFIX: '',
    EM_LOG_LEVEL: 'Debug',
    EM_AWS_S3_BUCKET: 'S3 Bucket value not set',
    EM_AWS_S3_KEY: 'S3 Key value not set',
    EM_PACKAGES_KEY_PREFIX: 'PACKAGES'
  });

  /**
   * Convenience values
   */
  const isProduction = nconf.get('NODE_ENV') === 'production';
  const isRemoteDebug = nconf.get('REMOTE_DEBUG') === 'true';
  const useDevSources = nconf.get('DEV_SOURCES') === 'true';
  const publicDir = isProduction || useDevSources ? './dist' : '../client';

  nconf.set('IS_PRODUCTION', isProduction);
  nconf.set('IS_REMOTE_DEBUG', isRemoteDebug);
  nconf.set('APP_VERSION', APP_VERSION);
  nconf.set('PUBLIC_DIR', publicDir);

  /**
   * Ensure required values are set
   */
  REQUIRED_VALUES.filter(v => nconf.get(v) === undefined).forEach((missing) => {
    throw new Error(`${missing} value is not set.`);
  });
}

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

let afterInit = (() => {
  let isInitialised = false;
  return fn => (...args) => {
    if (!isInitialised) {
      init();
      isInitialised = true;
    }
    return fn(...args);
  };
})();

module.exports = {
  logBootstrapValues: () => {
    LOGGED_VALUES.forEach((key) => {
      console.log(`${key}=${nconf.get(key)}`);
    });
  },
  get: afterInit(nconf.get.bind(nconf)),
  set: afterInit(nconf.set.bind(nconf)),
  setUserValue: afterInit(userSet),
  getUserValue: afterInit(userGet)
};


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let guid = __webpack_require__(41);
let logger = __webpack_require__(2);
let commandMetadata = __webpack_require__(73);

const COMMAND_TYPE = 'Command';
const QUERY_TYPE = 'Query';

module.exports = {
  sendCommand(handler, parameters, callback) {
    assert(typeof handler === 'function');
    assert(typeof parameters === 'object' && parameters !== null);
    let command = commandMetadata.createFromParameters(parameters);
    let message = getLogMessage(command);
    logger.info(message);

    let type = COMMAND_TYPE;
    let promise = handler(command);
    return promiseOrCallback(promise, command, type, callback);
  },

  sendQuery(handler, parameters, callback) {
    assert(typeof handler === 'function');
    assert(typeof parameters === 'object' && parameters !== null);
    let query = prepareQuery(parameters);
    let type = QUERY_TYPE;
    let promise = handler(query);
    return promiseOrCallback(promise, query, type, callback);
  }
};

function prepareQuery(parameters) {
  let query = Object.assign({}, parameters.query);

  if (parameters.parent) {
    query.queryId = parameters.parent.queryId;
    query.username = parameters.parent.username;
  }

  if (parameters.user) {
    query.queryId = guid();
    query.username = parameters.user.getName();
  }

  query.timestamp = new Date().toISOString();
  return query;
}

function promiseOrCallback(promise, commandOrQuery, type, callback) {
  promise.catch((error) => {
    if (commandOrQuery.suppressError !== true) {
      let errorMessage = getErrorMessage(commandOrQuery, error);
      logger.error(errorMessage, {
        error: {
          name: error.name,
          message: error.message,
          stack: error.toString(true)
        },
        command: type === COMMAND_TYPE ? commandOrQuery : undefined,
        query: type === QUERY_TYPE ? commandOrQuery : undefined
      });
    }
  });

  if (!callback) return promise;

  return promise.then(
    result => callback(null, result),
    error => callback(error)
  );
}

function getLogMessage(commandOrQuery) {
  return [
    `[${commandOrQuery.name}]`,
    JSON.stringify(commandOrQuery, null, '  ')
  ].join('\n');
}

function getErrorMessage(commandOrQuery, error) {
  return [
    'Error executing:',
    `[${commandOrQuery.name}]`,
    JSON.stringify(commandOrQuery, null, '  '),
    error.toString(true),
    JSON.stringify(error)
  ].join('\n');
}


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let stringifyError = function (error, detailed) {
  return detailed ? `${error.stack}/n` : `${error.name}: ${error.message}`;
};

class BaseError extends Error {

  constructor(message, innerError) {
    super();
    this.name = this.constructor.name;
    this.message = message;
    this.innerError = innerError;
    Error.captureStackTrace(this, this.constructor);
  }

  toString(detailed) {
    let errors = [];
    let currentError = this;

    while (currentError) {
      errors.push(currentError);
      currentError = currentError.innerError;
    }
    return errors.map(error => stringifyError(error, detailed)).join('/n');
  }
}

// eslint-disable-next-line no-extend-native
Error.prototype.toString = function (detailed) {
  return stringifyError(this, detailed);
};

module.exports = BaseError;


/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let environmentDatabase = __webpack_require__(54);
let DeploymentMap = __webpack_require__(191);
let EnvironmentType = __webpack_require__(43);

class Environment {

  constructor(data) {
    _.assign(this, data);
  }

  getEnvironmentType() {
    return EnvironmentType.getByName(this.EnvironmentType);
  }

  getDeploymentMap() {
    return DeploymentMap.getByName(this.DeploymentMap);
  }

  getAccountName() {
    return EnvironmentType.getByName(this.EnvironmentType).then(data => data.AWSAccountName);
  }

  static getAccountNameForEnvironment(name) {
    return Environment.getByName(name).then(environment => environment.getAccountName());
  }

  static getByName(name) {
    return environmentDatabase.getEnvironmentByName(name).then(obj => new Environment(obj));
  }
}

module.exports = Environment;


/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = require("bluebird");

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {

  DEPLOYMENT_INSTANCES_LIST_MAXIMUM_LENGTH: 300,

  DeploymentMode: {
    Overwrite: 'overwrite',
    BlueGreen: 'bg'
  },

  SliceName: {
    Blue: 'blue',
    Green: 'green'
  },

  DIFF_STATE: {
    Ignored: 'Ignored',
    Missing: 'Missing',
    Unexpected: 'Unexpected'
  },

  HEALTH_STATUS: {
    Healthy: 'Healthy',
    Warning: 'Warning',
    Error: 'Error',
    NoData: 'NoData',
    Unknown: 'Unknown',
    Missing: 'Missing'
  },

  ASGLifecycleState: {
    IN_SERVICE: 'InService'
  },

  NodeDeploymentStatus: {
    NotStarted: 'Not Started',
    InProgress: 'In Progress',
    Success: 'Success',
    Failed: 'Failed'
  },

  DEPLOYMENT_STATUS: {
    InProgress: 'In Progress',
    Success: 'Success',
    Failed: 'Failed',
    Cancelled: 'Cancelled',
    Unknown: 'Unknown'
  },

  AutoScalingNotificationType: {
    InstanceLaunch: 'autoscaling:EC2_INSTANCE_LAUNCH',
    InstanceLaunchError: 'autoscaling:EC2_INSTANCE_LAUNCH_ERROR',
    InstanceTerminate: 'autoscaling:EC2_INSTANCE_TERMINATE',
    InstanceTerminateError: 'autoscaling:EC2_INSTANCE_TERMINATE_ERROR'
  },

  ServiceAction: {
    INSTALL: 'Install',
    IGNORE: 'Ignore'
  }
};


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */



const createTopic = __webpack_require__(253);
const getTargetArn = __webpack_require__(254);
const createEvent = __webpack_require__(255);
const publishEvent = __webpack_require__(256);

/**
 * @param {any} event
 *
 * event: {
 *  topic: 'string' = topic name,
 *  message: 'string' = message content,
 *  attributes: 'object' = {
 *    key: 'object' = {
 *      DataType: 'string' = 'String',
 *      StringValue: 'string' = 'Value of the attribute'
 *    }
 *  }
 * }
 *
 * Valid topics:
 * EnvironmentManagerConfigurationChange
 *  optional extras for the topic: EnvironmentManagerConfigurationChange/somethingElse/SomethingElse
 * EnvironmentManagerOperationsChange
 *  optional extras for the topic: EnvironmentManagerOperationsChange/somethingElse/SomethingElse
 *
 * Valid keys for attributes:
 *  'EnvironmentType',
    'Environment',
    'OwningCluster',
    'User',
    'Result',
    'Timestamp',
    'Action',
    'ID',
    'EntityURL'
 *
 * Example use:
 * sns.publish({
 *  topic: 'EnvironmentManagerConfigurationChange',
 *  message: 'This is what will be sent as message content to the consumer',
 *  attributes: {
 *    ID: {
 *      DataType: 'String',
 *      StringValue: 'ThisIsMyIdValue'
 *    }
 *  }
 * })
 */
exports.publish = (event) => {
  createTopic(event.topic)
    .then(getTargetArn)
    .then(createEvent(event))
    .then(publishEvent)
    .catch((reason) => {
      console.log(reason);
    });
};

exports.TOPICS = {
  CONFIGURATION_CHANGE: 'EnvironmentManagerConfigurationChange',
  OPERATIONS_CHANGE: 'EnvironmentManagerOperationsChange'
};

exports.ACTIONS = {
  DELETE: 'delete',
  REMOVE: 'delete',
  UPDATE: 'update',
  PUT: 'update',
  CREATE: 'create',
  POST: 'create',
  PATCH: 'patch'
};


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let config = __webpack_require__(5);
let resourcePrefix = config.get('EM_AWS_RESOURCE_PREFIX');

module.exports = {
  getTableName: tableName => `${resourcePrefix}${tableName}`
};


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const AWS = __webpack_require__(29);
const guid = __webpack_require__(41);
const awsAccounts = __webpack_require__(31);
const createLowLevelDynamoClient = createClientWithRole(AWS.DynamoDB);
exports.createLowLevelDynamoClient = createLowLevelDynamoClient;
const createDynamoClient = createClientWithRole(AWS.DynamoDB.DocumentClient);
exports.createDynamoClient = createDynamoClient;
const createASGClient = createClientWithRole(AWS.AutoScaling);
exports.createASGClient = createASGClient;
const createEC2Client = createClientWithRole(AWS.EC2);
exports.createEC2Client = createEC2Client;
const createIAMClient = createClientWithRole(AWS.IAM);
exports.createIAMClient = createIAMClient;
const createS3Client = createClientWithRole(AWS.S3);
exports.createS3Client = createS3Client;
const createSNSClient = createClientWithRole(AWS.SNS);
exports.createSNSClient = createSNSClient;
function createClientWithRole(ClientType) {
    return (accountName) => awsAccounts.getByName(accountName)
        .then(({ RoleArn }) => (getCredentials(RoleArn)))
        .then((credentials) => ({ credentials }))
        .then((options) => new ClientType(options));
}
function getCredentials(roleARN) {
    return assumeRole(roleARN).then(({ Credentials }) => {
        if (Credentials === undefined) {
            throw new Error("Credentials was undefined");
        }
        return new AWS.Credentials(Credentials.AccessKeyId, Credentials.SecretAccessKey, Credentials.SessionToken);
    });
}
function assumeRole(roleARN) {
    const stsClient = new AWS.STS();
    const stsParameters = {
        RoleArn: roleARN,
        RoleSessionName: guid(),
    };
    return stsClient.assumeRole(stsParameters).promise();
}
exports.assumeRole = assumeRole;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let fp = __webpack_require__(4);

let versionOf = fp.get(['Audit', 'Version']);

function compareAndSetVersionOnReplace({ record, expectedVersion, expressions }) {
  if (expectedVersion === undefined) {
    throw new Error('expectedVersion is required');
  }
  let audit = Object.assign({}, record.Audit, { Version: expectedVersion + 1 });
  let condition =
    ['=',
      ['at', 'Audit', 'Version'],
      ['val', expectedVersion]];
  if (expressions && expressions.ConditionExpression) {
    let newExpressions = {
      ConditionExpression: ['and', expressions.ConditionExpression, condition]
    };
    return {
      record: Object.assign({}, record, { Audit: audit }),
      expressions: Object.assign({}, expressions, newExpressions)
    };
  } else {
    return {
      record: Object.assign({}, record, { Audit: audit }),
      expressions: {
        ConditionExpression: condition
      }
    };
  }
}

function compareAndSetVersionOnPut(hashKeyAttributeName) {
  return ({ record, expectedVersion, expressions }) => {
    if (expectedVersion === undefined) {
      throw new Error('expectedVersion is required');
    }
    let audit = Object.assign({}, record.Audit, { Version: expectedVersion + 1 });
    let condition =
      ['or',
        ['attribute_not_exists', ['at', hashKeyAttributeName]],
        ['=', ['at', 'Audit', 'Version'], ['val', expectedVersion]]];
    if (expressions && expressions.ConditionExpression) {
      let newExpressions = {
        ConditionExpression: ['and', expressions.ConditionExpression, condition]
      };
      return {
        record: Object.assign({}, record, { Audit: audit }),
        expressions: Object.assign({}, expressions, newExpressions)
      };
    } else {
      return {
        record: Object.assign({}, record, { Audit: audit }),
        expressions: {
          ConditionExpression: condition
        }
      };
    }
  };
}

function compareAndSetVersionOnCreate(hashKeyAttributeName) {
  return ({ record, expressions }) => {
    let audit = Object.assign({}, record.Audit, { Version: 1 });
    let condition =
      ['attribute_not_exists', ['at', hashKeyAttributeName]];
    if (expressions && expressions.ConditionExpression) {
      let newExpressions = {
        ConditionExpression: ['and', expressions.ConditionExpression, condition]
      };
      return {
        record: Object.assign({}, record, { Audit: audit }),
        expressions: Object.assign({}, expressions, newExpressions)
      };
    } else {
      return {
        record: Object.assign({}, record, { Audit: audit }),
        expressions: {
          ConditionExpression: condition
        }
      };
    }
  };
}

function compareVersionOnDelete(hashKeyAttributeName) {
  return ({ key, expectedVersion, expressions }) => {
    if (expectedVersion === undefined) {
      throw new Error('expectedVersion is required');
    }
    let condition =
      ['or',
        ['attribute_not_exists', ['at', hashKeyAttributeName]],
        ['=',
          ['at', 'Audit', 'Version'],
          ['val', expectedVersion]]
      ];
    if (expressions && expressions.ConditionExpression) {
      let newExpressions = {
        ConditionExpression: ['and', expressions.ConditionExpression, condition]
      };
      return {
        key,
        expressions: Object.assign({}, expressions, newExpressions)
      };
    } else {
      return {
        key,
        expressions: {
          ConditionExpression: condition
        }
      };
    }
  };
}

function compareAndSetVersionOnUpdate({ key, expectedVersion, expressions }) {
  if (expectedVersion === undefined) {
    throw new Error('expectedVersion is required');
  }
  let { ConditionExpression, UpdateExpression } = expressions;
  let optimisticCheck =
    ['=',
      ['at', 'Audit', 'Version'],
      ['val', expectedVersion]];
  let updateVersion = [['set',
    ['at', 'Audit', 'Version'],
    ['+',
      ['at', 'Audit', 'Version'],
      ['val', 1]]]];

  return {
    key,
    expressions: Object.assign({},
      expressions,
      { ConditionExpression: ConditionExpression ? ['and', ConditionExpression, optimisticCheck] : optimisticCheck },
      { UpdateExpression: UpdateExpression.concat(updateVersion) })
  };
}

function setVersionOnUpdate({ key, expressions }) {
  let { ConditionExpression, UpdateExpression } = expressions;
  let updateVersion = [['set',
    ['at', 'Audit', 'Version'],
    ['+',
      ['at', 'Audit', 'Version'],
      ['val', 1]]]];

  return {
    key,
    expressions: Object.assign({},
      expressions,
      ConditionExpression ? { ConditionExpression } : {},
      { UpdateExpression: UpdateExpression.concat(updateVersion) })
  };
}

module.exports = {
  compareAndSetVersionOnReplace,
  compareAndSetVersionOnCreate,
  compareAndSetVersionOnPut,
  compareVersionOnDelete,
  compareAndSetVersionOnUpdate,
  setVersionOnUpdate,
  versionOf
};


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const AWS = __webpack_require__(29);
module.exports = {
    createASGClient: () => Promise.resolve(new AWS.AutoScaling()),
    createDynamoClient: () => Promise.resolve(new AWS.DynamoDB.DocumentClient()),
    createEC2Client: () => Promise.resolve(new AWS.EC2()),
    createIAMClient: () => Promise.resolve(new AWS.IAM()),
    createLowLevelDynamoClient: () => Promise.resolve(new AWS.DynamoDB()),
    createS3Client: () => Promise.resolve(new AWS.S3()),
    createSNSClient: () => Promise.resolve(new AWS.SNS()),
};


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



function updateAuditMetadata({ updateExpression, metadata: { TransactionID, User } }) {
  return updateExpression.concat([
    ['set', ['at', 'Audit', 'LastChanged'], ['val', (new Date()).toISOString()]],
    ['set', ['at', 'Audit', 'TransactionID'], ['val', TransactionID]],
    ['set', ['at', 'Audit', 'User'], ['val', User]]
  ]);
}

function attachAuditMetadata({ record, metadata: { TransactionID, User } }) {
  let audit = Object.assign({}, record.Audit, {
    LastChanged: (new Date()).toISOString(),
    TransactionID,
    User
  });
  return Object.assign({}, record, { Audit: audit });
}

function getAuditMetadata(record) {
  return record.Audit;
}

function removeAuditMetadata(record) {
  let t = Object.assign({}, record);
  delete t.Audit;
  return t;
}

module.exports = {
  attachAuditMetadata,
  getAuditMetadata,
  removeAuditMetadata,
  updateAuditMetadata
};


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const LOGICAL_TABLE_NAME = 'ConfigEnvironments';
const TTL = 600; // seconds

let physicalTableName = __webpack_require__(13).getTableName;
let cachedSingleAccountDynamoTable = __webpack_require__(22);

module.exports = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let moment = __webpack_require__(76);
let co = __webpack_require__(0);
let EnvironmentType = __webpack_require__(43);
let Environment = __webpack_require__(9);
let serviceTargets = __webpack_require__(26);
let logger = __webpack_require__(2);
let TaggableMixin = __webpack_require__(78);
let AsgResourceBase = __webpack_require__(106);
let launchConfigurationResourceFactory = __webpack_require__(58);

const AutoScalingGroup = TaggableMixin(class {

  constructor(data) {
    _.assign(this, data);
  }

  getLaunchConfiguration() {
    let self = this;
    return co(function* () {
      let name = self.LaunchConfigurationName;
      if (name === undefined) {
        throw new Error(`Launch configuration doesn't exist for ${self.AutoScalingGroupName}`);
      }
      let client = yield launchConfigurationResourceFactory.create(null, { accountName: self.$accountName });
      return client.get({ name });
    });
  }

  getEnvironmentType() {
    return EnvironmentType.getByName(this.getTag('EnvironmentType'));
  }

  getRuntimeServerRoleName() {
    return this.getTag('Role');
  }

  deleteASG() {
    let environmentName = this.getTag('Environment');
    let self = this;
    return co(function* () {
      let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
      let asgResource = yield new AsgResourceBase(accountName);
      let launchConfigResource = yield launchConfigurationResourceFactory.create(null, { accountName });
      logger.info(`Deleting AutoScalingGroup ${self.AutoScalingGroupName} and associated Launch configuration ${self.LaunchConfigurationName}`);

      yield asgResource.delete({ name: self.AutoScalingGroupName, force: true });
      if (self.LaunchConfigurationName !== undefined) {
        // If not present it means that this ASG is already being deleted
        yield launchConfigResource.delete({ name: self.LaunchConfigurationName });
      }

      yield serviceTargets.removeRuntimeServerRoleTargetState(environmentName, self.getRuntimeServerRoleName());
      return true;
    });
  }

  static getAllByServerRoleName(environmentName, serverRoleName) {
    return AutoScalingGroup.getAllByEnvironment(environmentName)
      .then(asgs => _.filter(asgs, asg => asg.getTag('Role') === serverRoleName));
  }

  static getByName(accountName, autoScalingGroupName) {
    let asgResourceBase = new AsgResourceBase(accountName);
    return asgResourceBase.get({ name: autoScalingGroupName })
      .then((asg) => {
        let data = new AutoScalingGroup(asg);
        data.$accountName = accountName;
        data.$autoScalingGroupName = autoScalingGroupName;
        return data;
      });
  }

  static getAllByEnvironment(environmentName) {
    return co(function* () {
      let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
      let startTime = moment.utc();
      let asgResourceBase = new AsgResourceBase(accountName);

      return asgResourceBase.all({ names: undefined }).then((asgs = []) => {
        let duration = moment.duration(moment.utc().diff(startTime)).asMilliseconds();
        logger.debug(`server-status-query: AllAsgsQuery took ${duration}ms`);
        return asgs
          .map(asg => new AutoScalingGroup(asg))
          .filter(asg => asg.getTag('Environment', '') === environmentName);
      });
    });
  }
});

module.exports = AutoScalingGroup;


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let getMetadataForDynamoAudit = req => ({
  TransactionID: req.id,
  User: req.user.getName()
});

module.exports = {
  getMetadataForDynamoAudit
};


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let fp = __webpack_require__(4);

module.exports = (name, req) => fp.get(['swagger', 'params', name, 'value'])(req);


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let singleAccountDynamoTable = __webpack_require__(67);
let dynamoTableCache = __webpack_require__(157);

function factory(physicalTableName, { ttl }) {
  let cachedTable = dynamoTableCache(physicalTableName, { ttl });
  return singleAccountDynamoTable(physicalTableName, cachedTable);
}

module.exports = factory;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let when = (cond, fnTrue, fnFalse = () => null) =>
  x => (cond(x) ? fnTrue(x) : fnFalse(x));

let hasValue = x =>
  (x !== null && x !== undefined);

module.exports = {
  when,
  hasValue
};


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let { hasValue, when } = __webpack_require__(23);

let ifNotFound = when.bind(null, hasValue, data => res => res.json(data));

let notFoundMessage = resourceType =>
  () => res => res.status(404).json({ error: `The ${resourceType} was not found` });

module.exports = {
  ifNotFound,
  notFoundMessage
};


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let AsgResource = __webpack_require__(193);
let awsAccounts = __webpack_require__(31);
let fp = __webpack_require__(4);
let logger = __webpack_require__(2);

function getAccountId(accountName) {
  return awsAccounts.getByName(accountName)
    .then(fp.flow(fp.get('AccountNumber'), fp.toString));
}

module.exports = {

  canCreate: resourceDescriptor =>
    resourceDescriptor.type.toLowerCase() === 'asgs',

  create: (resourceDescriptor, parameters) => {
    logger.debug(`Getting ASG client for account "${parameters.accountName}"...`);

    return getAccountId(parameters.accountName).then((accountId) => {
      let asgResource = new AsgResource(accountId);
      return asgResource;
    });
  }
};


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let consulUpdater = __webpack_require__(107);

/**
 * Service Discovery abstraction to allow easy switching
 * of service discovery frameworks.
 */
module.exports = consulUpdater;


/***/ }),
/* 27 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const LOGICAL_TABLE_NAME = 'InfraConfigServices';
const TTL = 600; // seconds

let physicalTableName = __webpack_require__(13).getTableName;
let cachedSingleAccountDynamoTable = __webpack_require__(22);

let table = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });

function get(...args) {
  return table.get(...args).then((service) => {
    if (service && !service.Deleted) return service;
    return undefined;
  });
}

function ownedBy(owningCluster, returnDeleted) {
  let settings = getScanSettings({ owningCluster, returnDeleted });
  return table.scan(settings);
}

function scan(returnDeleted) {
  let settings = getScanSettings({ returnDeleted });
  return table.scan(settings);
}

function getScanSettings(options) {
  let predicates = [
    ...(options.owningCluster ? [['=', ['at', 'OwningCluster'], ['val', options.owningCluster]]] : []),
    ...(options.returnDeleted ? [] : [['<>', ['at', 'Deleted'], ['val', 'true']]])
  ];

  if (predicates.length === 0) return undefined;

  let filter = predicates.length === 1 ? predicates[0] : ['and', ...predicates];
  return { FilterExpression: filter };
}

module.exports = Object.assign({}, table, { ownedBy, scan, get });


/***/ }),
/* 29 */
/***/ (function(module, exports) {

module.exports = require("aws-sdk");

/***/ }),
/* 30 */
/***/ (function(module, exports) {

module.exports = require("js-joda");

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const assert = __webpack_require__(3);
const accounts_1 = __webpack_require__(100);
const ResourceNotFoundError = __webpack_require__(37);
function getByName(accountName) {
    const matches = (val) => `${accountName}`.toLowerCase() === `${val}`.toLowerCase();
    return Promise.resolve()
        .then(() => { assert(typeof accountName === "number" || typeof accountName === "string", `${accountName}`); })
        .then(getAllAccounts)
        .then((accounts) => {
        const matchingAccounts = [
            ...accounts.filter((account) => matches(account.AccountNumber)),
            ...accounts.filter((account) => matches(account.AccountName)),
        ];
        if (matchingAccounts.length > 0) {
            return matchingAccounts[0];
        }
        else {
            throw new ResourceNotFoundError(`AWS account ${accountName} not found`);
        }
    });
}
exports.getByName = getByName;
function getAMIsharingAccounts() {
    return getAllAccounts().then((accounts) => accounts.filter((a) => a.IncludeAMIs).map((a) => a.AccountNumber));
}
exports.getAMIsharingAccounts = getAMIsharingAccounts;
function getAllAccounts() {
    return accounts_1.scan();
}
exports.all = getAllAccounts;


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);

function getAutoScalingGroupName(configuration, sliceName) {
  assert(configuration, 'Expected \'configuration\' argument not to be null.');

  let segments = [
    configuration.environmentName,
    configuration.cluster.ShortName.toLowerCase(),
    getRoleName(configuration, sliceName)
  ];
  let autoScalingGroupName = segments.join('-');
  return autoScalingGroupName;
}

function getLaunchConfigurationName(configuration, sliceName) {
  assert(configuration, 'Expected \'configuration\' argument not to be null.');

  let autoScalingGroupName = getAutoScalingGroupName(configuration, sliceName);
  let launchConfigurationName = `LaunchConfig_${autoScalingGroupName}`;
  return launchConfigurationName;
}

/**
 * Note: by "serverRole" / "serverRoleName", we could mean:
 * 1. Deployment target, ie. server role name as in configuration, like "MultitenantOverwrite"
 * 2. Runtime server role, with slice, like "MultitenantOverwrite-blue"
 *
 */
function getRoleName(configuration, sliceName) {
  assert(configuration, 'Expected \'configuration\' argument not to be null.');

  let roleName = isAutoScalingGroupPerSlice(configuration)
    ? `${configuration.serverRole.ServerRoleName}-${sliceName}`
    : configuration.serverRole.ServerRoleName;
  return roleName;
}

function isAutoScalingGroupPerSlice(configuration) {
  return configuration.serverRole.FleetPerSlice === true;
}

module.exports = {
  getAutoScalingGroupName,
  getLaunchConfigurationName,
  getRoleName
};


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function AwsError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
/**
 * An in-memory cache that decouples the getting of an item from
 * the handling of a cache miss.
 */



let cacheManager = __webpack_require__(158);
let cacheManagerEncryptedRedis = __webpack_require__(159);
let config = __webpack_require__(5);
let emCrypto = __webpack_require__(92);
let fp = __webpack_require__(4);
let logger = __webpack_require__(2);
let masterAccountClient = __webpack_require__(16);

const DEFAULT_TTL_SECONDS = 10;
const REDIS_READ_TIMEOUT = 1000;
const REDIS_WRITE_TIMEOUT = 1000;

const caches = new Map();

let redisCachePromise = (() => {
  const EM_REDIS_ADDRESS = config.get('EM_REDIS_ADDRESS');
  const EM_REDIS_PORT = config.get('EM_REDIS_PORT');

  let redisCryptoKeyPromise = (() => {
    const EM_REDIS_CRYPTO_KEY = config.get('EM_REDIS_CRYPTO_KEY');
    const EM_REDIS_CRYPTO_KEY_S3_BUCKET = config.get('EM_REDIS_CRYPTO_KEY_S3_BUCKET');
    const EM_REDIS_CRYPTO_KEY_S3_KEY = config.get('EM_REDIS_CRYPTO_KEY_S3_KEY');

    if (EM_REDIS_CRYPTO_KEY) {
      return Promise.resolve(EM_REDIS_CRYPTO_KEY);
    } else if (EM_REDIS_CRYPTO_KEY_S3_BUCKET && EM_REDIS_CRYPTO_KEY_S3_KEY) {
      return masterAccountClient.createS3Client().then(s3 => s3.getObject({
        Bucket: EM_REDIS_CRYPTO_KEY_S3_BUCKET,
        Key: EM_REDIS_CRYPTO_KEY_S3_KEY
      }).promise()).then(rsp => rsp.Body, (error) => {
        logger.warn(`Failed to get Redis Crypto Key: Bucket=${EM_REDIS_CRYPTO_KEY_S3_BUCKET} Key=${EM_REDIS_CRYPTO_KEY_S3_KEY}`);
        logger.error(error);
        return Promise.resolve();
      });
    } else {
      return Promise.resolve();
    }
  })();

  return redisCryptoKeyPromise.then((cryptokey) => {
    if (cryptokey && EM_REDIS_ADDRESS && EM_REDIS_PORT) {
      let redisStore = cacheManagerEncryptedRedis.create({
        host: EM_REDIS_ADDRESS,
        port: EM_REDIS_PORT,
        valueTransform: {
          toStore: fp.flow(JSON.stringify, str => new Buffer(str), emCrypto.encrypt.bind(null, cryptokey)),
          fromStore: fp.flow(emCrypto.decrypt.bind(null, cryptokey), buf => buf.toString(), JSON.parse)
        },
        readTimeout: REDIS_READ_TIMEOUT,
        writeTimeout: REDIS_WRITE_TIMEOUT,
        ttl: DEFAULT_TTL_SECONDS
      });
      logger.info(`Cache will use Redis. address=${EM_REDIS_ADDRESS} port=${EM_REDIS_PORT}`);
      return [cacheManager.caching({ store: redisStore })];
    } else {
      logger.warn('Cache will not use Redis because it has not been configured.');
      return [];
    }
  });
})();

let memoryCache = cacheManager.caching({ store: 'memory', max: 256, ttl: 1 });
let cachePromise = redisCachePromise.then(redisCache => cacheManager.multiCaching([memoryCache].concat(redisCache)));

const myCacheManager = {
  /**
   * Create a cache that delegates to an async function on a cache miss.
   * @param {string} name - identifies the cache.
   * @param {CacheMissCallback} fn - function called to get the value on a cache miss.
   */
  create(name, fn, options) {
    if (typeof fn !== 'function') {
      throw new Error(`fn must be a function. fn = ${fn}`);
    }

    if (caches.has(name)) {
      throw new Error(`Cache "${name}" already exists`);
    }

    let result = createCache(name, fn, options);
    caches.set(name, result);
    return result;
  },

  get(name) {
    if (caches.has(name)) {
      return caches.get(name);
    }

    throw new Error(`Cache "${name}" does not exist`);
  },

  hasCache(name) {
    return caches.has(name);
  },

  /**
   * Clear all named caches.
   * This method should only be used by tests.
   */
  clear() {
    caches.clear();
    return cachePromise.then(cache => cache.reset());
  },

  /**
   * Clear cache contents leaving cache-miss handler functions in place.
   */
  flush() {
    return cachePromise.then(cache => cache.reset());
  }
};

function createCache(name, fn, options) {
  function cacheKey(key) {
    return JSON.stringify({ ns: name, key });
  }

  function normalizeValue(item) {
    if (item && item.value && item.ttl) {
      return item.value;
    } else {
      return item;
    }
  }

  /**
   * Get an item from the cache.
   */
  function get(key) {
    if (!(key && typeof key === 'string')) {
      throw new Error('Cache key must be a string.');
    }

    /**
     * The callback passed to cache.wrap cannot be an arrow function
     * because its `this` argument is bound.
     */
    // eslint-disable-next-line prefer-arrow-callback
    return cachePromise.then(cache => cache.wrap(cacheKey(key), function () {
      logger.info(`Cache miss: namespace="${name}", key="${key}"`);
      return Promise.resolve().then(() => fn(key)).then(normalizeValue);
    }, { ttl: fp.get('stdTTL')(options) || DEFAULT_TTL_SECONDS }));
  }

  /**
   * Evict an item from the cache.
   */
  function del(key) {
    return cachePromise.then(cache => cache.del(cacheKey(key)));
  }

  function setInCache(key, item) {
    return cachePromise.then(cache => cache.set(key, normalizeValue(item)));
  }

  function flush() {
    return cachePromise.then(cache => cache.flush);
  }

  return {
    get,
    del,
    // keys: cache.keys.bind(cache),
    set: setInCache,
    flush
  };
}

module.exports = myCacheManager;


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let { getTableName: physicalTableName } = __webpack_require__(13);
let Promise = __webpack_require__(10);
let logger = __webpack_require__(2);
let describeDynamoTable = __webpack_require__(68);
let { hashKeyAttributeName } = __webpack_require__(47);
let { DateTimeFormatterBuilder, LocalDate, ZoneId } = __webpack_require__(30);
let { makeWritable } = __webpack_require__(89);
let dynamoTable = __webpack_require__(48);
let fp = __webpack_require__(4);

const DEFAULT_SCAN_EXPRESSIONS = {
  ProjectionExpression: ['list', ', ',
    ['at', 'AccountName'],
    ['at', 'DeploymentID'],
    ['at', 'Value', 'EndTimestamp'],
    ['at', 'Value', 'EnvironmentName'],
    ['at', 'Value', 'EnvironmentType'],
    ['at', 'Value', 'Nodes'],
    ['at', 'Value', 'OwningCluster'],
    ['at', 'Value', 'RuntimeServerRoleName'],
    ['at', 'Value', 'ServerRoleName'],
    ['at', 'Value', 'ServiceName'],
    ['at', 'Value', 'ServiceSlice'],
    ['at', 'Value', 'ServiceVersion'],
    ['at', 'Value', 'StartTimestamp'],
    ['at', 'Value', 'Status'],
    ['at', 'Value', 'User']]
};

const ES_DATETIME_FORMAT = new DateTimeFormatterBuilder().appendInstant(3).toFormatter();

function factory({ archivedDeploymentsTable, archivedDeploymentsIndex, runningDeploymentsTable }) {
  let tableNames = [archivedDeploymentsTable, runningDeploymentsTable];

  function myTables() {
    return Promise.resolve(tableNames);
  }

  function create(item) {
    return describeDynamoTable(runningDeploymentsTable).then(description =>
      fp.flow(
        makeWritable,
        record => ({
          record,
          expressions: {
            ConditionExpression: ['attribute_not_exists', ['at', hashKeyAttributeName(description)]]
          }
        }),
        dynamoTable.create.bind(null, runningDeploymentsTable)
      )(item)
    );
  }

  function get(key) {
    let firstFoundOrNull = fp.flow(fp.find(x => x !== null), fp.defaultTo(null));
    return Promise.map(myTables(), tableName => dynamoTable.get(tableName, key))
      .then(firstFoundOrNull);
  }

  function scanRunning(expressions) {
    return dynamoTable.scan(runningDeploymentsTable, Object.assign({}, DEFAULT_SCAN_EXPRESSIONS, expressions));
  }

  function queryByDateRange(minInstant, maxInstant, expressions) {
    function scanArchived() {
      function next(prevKey) {
        return prevKey.minusDays(1);
      }

      let createQuery = date => ({
        IndexName: archivedDeploymentsIndex,
        KeyConditionExpression: ['and',
          ['=', ['at', 'StartDate'], ['val', date.toString()]],
          ['>=', ['at', 'StartTimestamp'], ['val', ES_DATETIME_FORMAT.format(minInstant)]]],
        Limit: 100,
        ScanIndexForward: false
      });

      function loop(table, partition, lowerBound, results) {
        let partitionContainingLowerBound = LocalDate.ofInstant(lowerBound, ZoneId.UTC);
        if (partition.isBefore(partitionContainingLowerBound)) {
          return results;
        } else {
          return dynamoTable.query(table, Object.assign({}, DEFAULT_SCAN_EXPRESSIONS, expressions, createQuery(partition)))
            .then((result) => {
              results.push(...result);
              return loop(table, next(partition), lowerBound, results);
            });
        }
      }

      let firstPartition = LocalDate.ofInstant(maxInstant, ZoneId.UTC);
      return loop(archivedDeploymentsTable, firstPartition, minInstant, [])
      .catch((error) => {
        logger.warn(error);
        return [];
      });
    }

    return Promise.join(
      scanRunning(expressions),
      scanArchived(),
      (running, archived) => [...running, ...archived]);
  }

  function update(expression) {
    return Promise.resolve().then(() =>
      fp.flow(
        ({ key, updateExpression }) => ({
          key,
          expressions: { UpdateExpression: updateExpression }
        }),
        dynamoTable.update.bind(null, runningDeploymentsTable)
      )(expression)
    );
  }

  function appendLogEntries({ key, logEntries }) {
    let updateExpression = [
      'update',
      ['set',
        ['at', 'Value', 'ExecutionLog'],
        ['list_append',
          ['at', 'Value', 'ExecutionLog'],
          ['val', logEntries]]]
    ];

    return update({
      key,
      updateExpression
    });
  }

  return {
    appendLogEntries,
    create,
    get,
    queryByDateRange,
    scanRunning,
    update
  };
}

module.exports = factory({
  archivedDeploymentsTable: physicalTableName('ConfigCompletedDeployments'),
  archivedDeploymentsIndex: 'StartDate-StartTimestamp-index',
  runningDeploymentsTable: physicalTableName('ConfigDeploymentExecutionStatus')
});


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function ConfigurationError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function ResourceNotFoundError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const LOGICAL_TABLE_NAME = 'InfraConfigLBUpstream';

let {
  getTableName: physicalTableName
} = __webpack_require__(13);
let pages = __webpack_require__(49);
let { compile } = __webpack_require__(69);
let { updateAuditMetadata } = __webpack_require__(17);
let { createDynamoClient: documentClient } = __webpack_require__(16);
let dynamoTable = __webpack_require__(48);
let singleAccountDynamoTable = __webpack_require__(67);
let { setVersionOnUpdate } = __webpack_require__(15);

const TABLE_NAME = physicalTableName(LOGICAL_TABLE_NAME);

let table = singleAccountDynamoTable(TABLE_NAME, dynamoTable);

function inEnvironment(environment, { ExclusiveStartKey, Limit, ScanIndexForward } = {}) {
  return documentClient()
    .then((dynamo) => {
      let KeyConditionExpression = ['=',
        ['at', 'Environment'],
        ['val', environment]];
      let params = Object.assign(
        {
          IndexName: 'Environment-Key-index',
          TableName: TABLE_NAME
        },
        (ExclusiveStartKey ? { ExclusiveStartKey } : {}),
        (Limit ? { Limit } : {}),
        (ScanIndexForward !== null && ScanIndexForward !== undefined ? { ScanIndexForward } : {}),
        compile({ KeyConditionExpression }));
      return dynamo.query(params);
    })
    .then(awsRequest => (Limit
      ? awsRequest.promise().then(({ LastEvaluatedKey, Items }) => ({ LastEvaluatedKey, Items }))
      : pages.flatten(rsp => rsp.Items, awsRequest).then(x => ({ Items: x }))));
}

function inEnvironmentWithService(environment, service) {
  let params = {
    FilterExpression: ['=',
      ['at', 'Service'],
      ['val', service]
    ],
    IndexName: 'Environment-Key-index',
    KeyConditionExpression: ['=',
      ['at', 'Environment'],
      ['val', environment]]
  };
  return table.query(params);
}

function inEnvironmentWithUpstream(environment, upstream) {
  let params = {
    FilterExpression: ['=',
      ['at', 'Upstream'],
      ['val', upstream]
    ],
    IndexName: 'Environment-Key-index',
    KeyConditionExpression: ['=',
      ['at', 'Environment'],
      ['val', environment]]
  };
  return table.query(params);
}

function inLoadBalancerGroup(loadBalancerGroup) {
  return documentClient()
    .then((dynamo) => {
      let KeyConditionExpression = ['=',
        ['at', 'LoadBalancerGroup'],
        ['val', loadBalancerGroup]];
      let params = Object.assign(
        {
          IndexName: 'LoadBalancerGroup-index',
          TableName: TABLE_NAME
        },
        compile({ KeyConditionExpression }));
      return pages.flatten(rsp => rsp.Items, dynamo.query(params)).then(x => ({ Items: x }));
    });
}

function scan() {
  return documentClient()
    .then((dynamo) => {
      let params = {
        IndexName: 'Environment-Key-index',
        TableName: TABLE_NAME
      };
      return pages.flatten(rsp => rsp.Items, dynamo.scan(params)).then(x => ({ Items: x }));
    });
}

function determineState(host, toggleCommand, servicePortMappings) {
  if (toggleCommand.activeSlice) {
    return servicePortMappings[host.Port].toLowerCase() ===
      toggleCommand.activeSlice.toLowerCase() ? 'up' : 'down';
  }
  return host.State.toUpperCase() === 'UP' ? 'down' : 'up';
}

function toggle(upstream, metadata, toggleCommand, servicePortMappings) {
  let invert = host => determineState(host, toggleCommand, servicePortMappings);

  let key = { Key: upstream.Key };
  let expressions = {
    ConditionExpression: ['and',
      ...(upstream.Hosts.map((host, i) => ['=', ['at', 'Hosts', i, 'State'], ['val', host.State]]))],
    UpdateExpression: updateAuditMetadata({
      updateExpression: ['update',
        ...(upstream.Hosts.map((host, i) => ['set', ['at', 'Hosts', i, 'State'], ['val', invert(host)]]))],
      metadata
    })
  };

  return dynamoTable.update(TABLE_NAME, setVersionOnUpdate({ key, expressions }));
}

module.exports = {
  create: table.create,
  delete: table.delete,
  get: table.get,
  inEnvironment,
  inEnvironmentWithService,
  inEnvironmentWithUpstream,
  inLoadBalancerGroup,
  replace: table.replace,
  scan,
  toggle,
  update: table.update
};


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let logger = __webpack_require__(2);
let deploymentLogger = __webpack_require__(59);

module.exports = function DeploymentCommandHandlerLogger(commandOrDeploymentId) {
  let deploymentId = (() => {
    if (typeof commandOrDeploymentId === 'string') {
      return commandOrDeploymentId;
    } else {
      return commandOrDeploymentId.deploymentId || commandOrDeploymentId.commandId;
    }
  })();

  this.debug = logger.debug.bind(logger);

  this.info = function (message) {
    logger.info(message);
    deploymentLogger.inProgress(deploymentId, message);
  };

  this.warn = function (message) {
    logger.warn(message);
    deploymentLogger.inProgress(deploymentId, message);
  };

  this.error = logger.error.bind(logger);
};


/***/ }),
/* 40 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 41 */
/***/ (function(module, exports) {

module.exports = require("uuid/v1");

/***/ }),
/* 42 */
/***/ (function(module, exports) {

module.exports = require("ms");

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let environmentDatabase = __webpack_require__(54);

class EnvironmentType {

  constructor(data) {
    _.assign(this, data);
  }

  static getByName(name) {
    return environmentDatabase.getEnvironmentTypeByName(name);
  }

}

module.exports = EnvironmentType;


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let config = __webpack_require__(5);
let consul = __webpack_require__(197);
let mock = __webpack_require__(198);
let prod = __webpack_require__(199);

let clientConfig = config.get('IS_PRODUCTION') ? prod : mock;

function createConfig(options) {
  return clientConfig(options);
}

function create(options) {
  return createConfig(options).then(newConfig => consul(newConfig));
}

module.exports = { createConfig, create };


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const LOGICAL_TABLE_NAME = 'InfraOpsEnvironment';
const TTL = 1200; // seconds

let physicalTableName = __webpack_require__(13).getTableName;
let cachedSingleAccountDynamoTable = __webpack_require__(22);

let table = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });

function setSchedule({ key, metadata, schedule }, expectedVersion) {
  let scheduleAttributes = Object.keys(schedule).map(prop => ['set', ['at', 'Value', prop], ['val', schedule[prop]]]);
  let updateExpression = ['update', ...scheduleAttributes];
  return table.update({ key, metadata, updateExpression }, expectedVersion);
}

function setMaintenance({ key, metadata, isInMaintenance }, expectedVersion) {
  let updateExpression = ['update',
    ['set', ['at', 'Value', 'EnvironmentInMaintenance'], ['val', isInMaintenance]]
  ];
  return table.update({ key, metadata, updateExpression }, expectedVersion);
}

function setDeploymentLock({ key, metadata, isLocked }, expectedVersion) {
  let updateExpression = ['update',
    ['set', ['at', 'Value', 'DeploymentsLocked'], ['val', isLocked]]
  ];
  return table.update({ key, metadata, updateExpression }, expectedVersion);
}

module.exports = Object.assign({}, table, { setDeploymentLock, setMaintenance, setSchedule });


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __webpack_require__(27);
const path_1 = __webpack_require__(40);
module.exports = function findInAncestor(relativePath, startDir = ".") {
    function loop(dir) {
        const file = path_1.resolve(dir, relativePath);
        const parentDir = path_1.dirname(dir);
        if (fs_1.existsSync(file)) {
            return file;
        }
        else if (dir === parentDir) {
            return undefined;
        }
        else {
            return loop(parentDir);
        }
    }
    return loop(path_1.resolve(startDir));
};


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let fp = __webpack_require__(4);

let tableArn = fp.get(['Table', 'TableArn']);

let hashKeyAttributeName = fp.flow(
  fp.get(['Table', 'KeySchema']),
  fp.find({ KeyType: 'HASH' }),
  fp.get(['AttributeName']));

let keyAttributeNames = fp.flow(
  fp.get(['Table', 'KeySchema']),
  fp.map(fp.get(['AttributeName'])));

let tableName = fp.get(['Table', 'TableName']);

let extractKey = (tableDescription, item) => fp.pick(keyAttributeNames(tableDescription))(item);

/**
 * @description Construct a DynamoDB hash key
 * @param {object} tableDescription - The table description
 * @param {string} key - The value of the hash key
 * @returns {object} - The DynamoDB hash key
 * @example
 * For a table having a hash key attribute named 'ID'
 * hashkey(tableDescription, '1006') -> { ID: '1006' }
 */
let hashKey = (tableDescription, key) => fp.fromPairs([
  [hashKeyAttributeName(tableDescription), key]
]);

module.exports = {
  extractKey,
  hashKey,
  hashKeyAttributeName,
  keyAttributeNames,
  tableName,
  tableArn
};


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let extractKey = __webpack_require__(47).extractKey;
let describeDynamoTable = __webpack_require__(68);
let pages = __webpack_require__(49);
let { createDynamoClient: DocumentClient } = __webpack_require__(16);
let compile = __webpack_require__(69).compile;

function compileIfSet(expressions) {
  if (expressions && typeof expressions === 'object') {
    return compile(expressions);
  } else {
    return {};
  }
}

let logError = params => (error) => {
  console.error(JSON.stringify(params, null, 2));
  return Promise.reject(error);
};

function get(TableName, key) {
  let params = {
    TableName,
    Key: key
  };
  return DocumentClient()
    .then(dynamo => dynamo.get(params).promise())
    .then(result => result.Item || null)
    .catch(logError(params));
}

function scan(TableName, expressions) {
  let params = Object.assign({ TableName }, compileIfSet(expressions));
  return DocumentClient()
    .then(dynamo => pages.flatten(rsp => rsp.Items, dynamo.scan(params)))
    .catch(logError(params));
}

function query(TableName, expressions) {
  let params = Object.assign({ TableName }, compileIfSet(expressions));
  return DocumentClient()
    .then(dynamo => pages.flatten(rsp => rsp.Items, dynamo.query(params)))
    .catch(logError(params));
}

function create(TableName, { record, expressions }) {
  return describeDynamoTable(TableName).then((tableDescription) => {
    let params = Object.assign({ TableName, Item: record }, compileIfSet(expressions));
    return DocumentClient()
      .then(dynamo => dynamo.put(params).promise())
      .catch((error) => {
        if (error.code === 'ConditionalCheckFailedException') {
          let keyStr = JSON.stringify(extractKey(tableDescription, record));
          let message = `Could not create this item because an item with the same key already exists. table = ${TableName} key = ${keyStr}.`;
          return Promise.reject(new Error(message));
        }
        return Promise.reject(error);
      })
      .catch(logError(params));
  });
}

function replace(TableName, { record, expressions }) {
  return describeDynamoTable(TableName).then((tableDescription) => {
    let params = Object.assign({ TableName, Item: record }, compileIfSet(expressions));
    return DocumentClient()
      .then(dynamo => dynamo.put(params).promise())
      .catch((error) => {
        if (error.code === 'ConditionalCheckFailedException') {
          let keyStr = JSON.stringify(extractKey(tableDescription, record));
          let message = `Could not update this item because it has been modified. table = ${TableName} key = ${keyStr}.`;
          return Promise.reject(new Error(message));
        }
        return Promise.reject(error);
      })
      .catch(logError(params));
  });
}

function update(TableName, { key, expressions }) {
  return Promise.resolve().then(() => {
    let params = Object.assign({ TableName, Key: key }, compileIfSet(expressions));
    return DocumentClient()
      .then(dynamo => dynamo.update(params).promise())
      .catch((error) => {
        if (error.code === 'ConditionalCheckFailedException') {
          let keyStr = JSON.stringify(key);
          let message = `Could not update this item because it has been modified. table = ${TableName} key = ${keyStr}.`;
          return Promise.reject(new Error(message));
        }
        return Promise.reject(error);
      })
      .catch(logError(params));
  });
}

function $delete(TableName, { key, expressions }) {
  return Promise.resolve().then(() => {
    let params = Object.assign({ TableName, Key: key }, compileIfSet(expressions));
    return DocumentClient()
      .then(dynamo => dynamo.delete(params).promise())
      .catch((error) => {
        if (error.code === 'ConditionalCheckFailedException') {
          let keyStr = JSON.stringify(key);
          let message = `Could not delete this item because it has been modified. table = ${TableName} key = ${keyStr}.`;
          return Promise.reject(new Error(message));
        }
        return Promise.reject(error);
      })
      .catch(logError(params));
  });
}

module.exports = {
  create,
  delete: $delete,
  get,
  query,
  replace,
  scan,
  update
};


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



/**
 * Analogue of Array.reduce that iterates over the pages of an AWS Request object.
 *
 * @param {function} callback - (accumulator, page) -> accumulator.
 * @param {any} initialValue - initial value of accumulator.
 * @param {object} awsRequest - an instance of AWS.Request.
 *   See http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Request.html#eachPage
 * @returns {any} - returns the value of accumulator after applying callback to the
 *   last page.
 */
function reduce(callback, initialValue, awsRequest) {
  if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  let accumulator = initialValue;
  return new Promise((resolve, reject) => {
    awsRequest.eachPage((error, data) => {
      if (error) {
        reject(error);
        return false;
      } else if (data === null) {
        resolve(accumulator);
        return false;
      } else {
        accumulator = callback(accumulator, data);
        return true;
      }
    });
  });
}

/**
 * Flattens the result pages of an AWS Request object into a single array.
 *
 * @param {function} callback - page -> items. Selects the items that should be
 *   returned from the page.
 * @param {object} awsRequest - an instance of AWS.Request.
 *   See http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Request.html#eachPage
 * @returns {array} - returns the value of accumulator after applying callback to the
 *   last page.
 */
function flatten(callback, awsRequest) {
  if (typeof callback !== 'function') {
    throw new Error('callback must be a function');
  }

  function extractAndConcatItems(accumulator, page) {
    let items = callback(page);
    if (Array.isArray(items)) {
      items.forEach(item => accumulator.push(item));
    } else {
      accumulator.push(items);
    }
    return accumulator;
  }

  return reduce(extractAndConcatItems, [], awsRequest);
}

module.exports = {
  reduce,
  flatten
};


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let config = __webpack_require__(5);
const mock = __webpack_require__(168);
const Prod = __webpack_require__(169);
let implementation;

if (config.get('IS_PRODUCTION')) {
  implementation = new Prod();
} else {
  implementation = mock;
}

module.exports = implementation;


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



/**
 * Attempts to parse a JSON string into an object, returning null on error
 *
 * @param raw {String} The raw JSON string
 * @returns {Object|null} The parsed Object or null if a parsing error occured.
 */
function safeParseJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch (exception) {
    return null;
  }
}

/**
 *
 * @param date
 * @param offset
 * @returns {*}
 */
function offsetMilliseconds(date, offset) {
  date.setMilliseconds(date.getMilliseconds() + offset);
  return date;
}

module.exports = { safeParseJSON, offsetMilliseconds };


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let assert = __webpack_require__(3);
let co = __webpack_require__(0);
let ConfigurationError = __webpack_require__(36);
let DynamoItemNotFoundError = __webpack_require__(187);
let imageProvider = __webpack_require__(74);
let Environment = __webpack_require__(9);
let EnvironmentType = __webpack_require__(43);
let clusters = __webpack_require__(105);
let servicesDb = __webpack_require__(28);

module.exports = {
  get(environmentName, serviceName, serverRoleName) {
    assert(environmentName, 'Expected \'environmentName\' argument not to be null or empty');
    assert(serviceName, 'Expected \'serviceName\' argument not to be null or empty');
    assert(serverRoleName, 'Expected \'serviceName\' argument not to be null or empty');

    return co(function* () {
      let environment = yield Environment.getByName(environmentName);
      let deploymentMap = yield environment.getDeploymentMap();
      let service = yield getServiceByName(serviceName);
      let environmentType = yield EnvironmentType.getByName(environment.EnvironmentType).catch(
        error => Promise.reject(new ConfigurationError(
          `An error has occurred retrieving environment "${environmentName}" environment type.`,
          error))
      );
      let serverRole = _.find(deploymentMap.DeploymentTarget, { ServerRoleName: serverRoleName });

      let cluster = yield getClusterByName(serverRole.OwningCluster);
      let image = yield imageProvider.get(serverRole.AMI);
      let configuration = {
        environmentTypeName: environment.EnvironmentType,
        environmentName,
        serviceName,
        environmentType,
        environment,
        serverRole,
        service,
        cluster,
        image
      };
      return Promise.resolve(configuration);
    });
  }
};

function getServiceByName(serviceName) {
  return servicesDb.get({ ServiceName: serviceName })
    .then(service =>
      (service ?
        Promise.resolve(service.Value) :
        Promise.reject(new ConfigurationError(`Service "${serviceName}" not found.`))))
    .catch((error) => {
      throw new Error(`An error has occurred retrieving "${serviceName}" service: ${error.message}`);
    });
}

function getClusterByName(clusterName) {
  return clusters.get({ ClusterName: clusterName })
    .then(
    cluster => Promise.resolve({
      Name: cluster.ClusterName,
      ShortName: cluster.Value.ShortName,
      KeyPair: cluster.Value.KeyPair
    }),
    error => Promise.reject(error instanceof DynamoItemNotFoundError ?
      new ConfigurationError(`Cluster "${clusterName}" not found.`) :
      new Error(`An error has occurred retrieving "${clusterName}" cluster: ${error.message}`)
    ));
}


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let awsAccounts = __webpack_require__(31);
let applyFuncToAccounts = __webpack_require__(101);
let imageSummary = __webpack_require__(102);
let ec2ImageResourceFactory = __webpack_require__(103);

module.exports = function ScanCrossAccountImages(query) {
  return awsAccounts.all()
    .then(accounts => applyFuncToAccounts(({ AccountName }) => getFromSingleAccount(Object.assign({ accountName: AccountName }, query)), accounts))
    .then(images =>
      imageSummary
      .rank(images.map(image => Object.assign({ AccountName: image.AccountName }, imageSummary.summaryOf(image)))
      .sort(imageSummary.compare))
    );
};

function getFromSingleAccount(query) {
  let parameters = { accountName: query.accountName };
  return ec2ImageResourceFactory.create(undefined, parameters)
    .then(resource => resource.all({ filter: query.filter }));
}


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let configEnvironments = __webpack_require__(18);
let configEnvironmentTypes = __webpack_require__(55);
let ConfigurationError = __webpack_require__(36);

function getEnvironmentByName(environmentName) {
  return configEnvironments.get({ EnvironmentName: environmentName })
    .then((environment) => {
      if (environment) {
        return Promise.resolve(environment.Value);
      } else {
        return Promise.reject(new ConfigurationError(`Environment "${environmentName}" not found.`));
      }
    });
}

function getEnvironmentTypeByName(environmentTypeName) {
  return configEnvironmentTypes.get({ EnvironmentType: environmentTypeName })
    .then((environment) => {
      if (environment) {
        return Promise.resolve(environment.Value);
      } else {
        return Promise.reject(new ConfigurationError(`Environment type "${environmentTypeName}" not found.`));
      }
    });
}

module.exports = {
  getEnvironmentByName,
  getEnvironmentTypeByName
};


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const LOGICAL_TABLE_NAME = 'ConfigEnvironmentTypes';
const TTL = 600; // seconds

let physicalTableName = __webpack_require__(13).getTableName;
let cachedSingleAccountDynamoTable = __webpack_require__(22);

module.exports = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let getASG = __webpack_require__(192);

module.exports = function GetAutoScalingGroup(query) {
  assert(query.accountName);
  assert(query.autoScalingGroupName);

  return getASG(query);
};


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let environmentDatabase = __webpack_require__(54);
let cacheManager = __webpack_require__(34);

const TEN_MINUTES = 10 * 60;

cacheManager.create('Environment', x => environmentDatabase.getEnvironmentByName(x), { stdTTL: TEN_MINUTES });
cacheManager.create('EnvironmentType', x => environmentDatabase.getEnvironmentTypeByName(x), { stdTTL: TEN_MINUTES });

function getEnvironmentByName(name) {
  return cacheManager.get('Environment').get(name);
}

function getEnvironmentTypeByName(name) {
  return cacheManager.get('EnvironmentType').get(name);
}

function getConsulConfig(environmentName) {
  return co(function* () {
    let environment = yield getEnvironmentByName(environmentName);
    let environmentType = yield getEnvironmentTypeByName(environment.EnvironmentType);
    return environmentType.Consul;
  });
}

module.exports = {
  getEnvironmentByName,
  getEnvironmentTypeByName,
  getConsulConfig
};


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let amazonClientFactory = __webpack_require__(14);

let AwsError = __webpack_require__(33);
let LaunchConfigurationAlreadyExistsError = __webpack_require__(202);

function standardifyError(error, launchConfigurationName) {
  if (!error) return null;

  let awsError = new AwsError(error.message);

  if (error.code === 'AlreadyExists') {
    return new LaunchConfigurationAlreadyExistsError(
      `LaunchConfiguration "${launchConfigurationName}" already exists`, awsError
    );
  }

  return awsError;
}

function cleanup(launchconfig) {
  delete launchconfig.LaunchConfigurationARN;
  delete launchconfig.CreatedTime;

  if (_.isNull(launchconfig.KernelId) || _.isEmpty(launchconfig.KernelId)) delete launchconfig.KernelId;
  if (_.isNull(launchconfig.RamdiskId) || _.isEmpty(launchconfig.RamdiskId)) delete launchconfig.RamdiskId;
}

class LaunchConfigurationResource {

  constructor(client) {
    this.client = client;
  }

  describeLaunchConfigurations(names) {
    let self = this;
    let launchconfigs = [];
    let request = {};

    if (names.length) {
      request.LaunchConfigurationNames = names;
    }

    function query() {
      return self.client.describeLaunchConfigurations(request).promise().then((data) => {
        launchconfigs = launchconfigs.concat(data.LaunchConfigurations);

        if (!data.NextToken) return launchconfigs;

        // Scan from next index
        request.NextToken = data.NextToken;
        return query();
      });
    }

    return query();
  }

  get(parameters) {
    return this.describeLaunchConfigurations([parameters.name]).then(data => data[0]);
  }

  all(parameters) {
    return this.describeLaunchConfigurations(parameters.names || []);
  }

  delete({ name }) {
    let request = { LaunchConfigurationName: name };

    return this.client.deleteLaunchConfiguration(request).promise().catch((error) => {
      throw standardifyError(error, name);
    });
  }

  post(parameters) {
    cleanup(parameters);

    let request = parameters;
    return this.client.createLaunchConfiguration(request).promise().catch((error) => {
      throw standardifyError(error, parameters.LaunchConfigurationName);
    });
  }
}

module.exports = {

  canCreate: resourceDescriptor =>
    resourceDescriptor.type.toLowerCase() === 'launchconfig',

  create: (resourceDescriptor, parameters) =>
    amazonClientFactory.createASGClient(parameters.accountName).then(client => new LaunchConfigurationResource(client))
};


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let systemUser = __webpack_require__(203);
let sender = __webpack_require__(6);
let deployments = __webpack_require__(35);
let DeploymentLogsStreamer = __webpack_require__(111);
let deploymentLogsStreamer = new DeploymentLogsStreamer();
let Enums = __webpack_require__(11);
let logger = __webpack_require__(2);
let UpdateTargetState = __webpack_require__(112);

module.exports = {
  started(deployment, accountName) {
    let record = {
      AccountName: deployment.accountName,
      DeploymentID: deployment.id,
      Value: {
        DeploymentType: 'Parallel',
        EnvironmentName: deployment.environmentName,
        EnvironmentType: deployment.environmentTypeName,
        OwningCluster: deployment.clusterName,
        SchemaVersion: 2,
        ServiceName: deployment.serviceName,
        ServiceSlice: deployment.serviceSlice,
        ServiceVersion: deployment.serviceVersion,
        RuntimeServerRoleName: deployment.serverRole,
        ServerRoleName: deployment.serverRoleName,
        Status: 'In Progress',
        User: deployment.username,
        StartTimestamp: new Date().toISOString(),
        EndTimestamp: null,
        ExecutionLog: []
      }
    };

    return deployments.create(record).then(() => {
      deploymentLogsStreamer.log(deployment.id, accountName, 'Deployment started');
    });
  },

  inProgress(deploymentId, message) {
    deploymentLogsStreamer.log(deploymentId, message);
  },

  updateStatus(deploymentStatus, newStatus) {
    let logError = error => logger.error(error);

    logger.debug(`Updating deployment '${deploymentStatus.deploymentId}' status to '${newStatus.name}'`);

    /**
     * flush log entries before changing status. A status change may move
     * the record to another table. If this occurs before the log entries
     * are flushed then the log entries may not be written.
     */
    return updateDeploymentTargetState(deploymentStatus, newStatus)
      .catch(logError)
      .then(() => deploymentLogsStreamer.log(deploymentStatus.deploymentId, newStatus.reason))
      .then(() => deploymentLogsStreamer.flush(deploymentStatus.deploymentId))
      .catch(logError)
      .then(() => updateDeploymentDynamoTable(deploymentStatus, newStatus))
      .catch(logError);
  }
};

function updateDeploymentDynamoTable(deploymentStatus, newStatus) {
  let { Success, InProgress } = Enums.DEPLOYMENT_STATUS;
  let running = newStatus.name === InProgress;
  let succeeded = newStatus.name === Success;

  let updateExpression = ['update',
    ['set', ['at', 'Value', 'Status'], ['val', newStatus.name]],
    ['set', ['at', 'Value', 'Nodes'], ['val', deploymentStatus.nodesDeployment || []]]
  ];

  if (!running && !succeeded && newStatus.reason !== undefined) {
    updateExpression.push(['set', ['at', 'Value', 'ErrorReason'], ['val', newStatus.reason]]);
  }
  if (!running) {
    updateExpression.push(['set', ['at', 'Value', 'EndTimestamp'], ['val', new Date().toISOString()]]);
  }

  return deployments.update({ key: { DeploymentID: deploymentStatus.deploymentId }, updateExpression });
}

function updateDeploymentTargetState(deploymentStatus, newStatus) {
  let command = {
    deploymentId: deploymentStatus.deploymentId,
    name: 'UpdateTargetState',
    environment: deploymentStatus.environmentName,
    key: `deployments/${deploymentStatus.deploymentId}/overall_status`,
    value: newStatus.name
  };

  return sender.sendCommand(UpdateTargetState, { command, user: systemUser });
}


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let co = __webpack_require__(0);
let amazonClientFactory = __webpack_require__(14);
let Environment = __webpack_require__(9);
let moment = __webpack_require__(76);
let logger = __webpack_require__(2);
let TaggableMixin = __webpack_require__(78);
const InstanceResourceBase = __webpack_require__(115);
let scanCrossAccountFn = __webpack_require__(80);

class Instance {
  constructor(data) {
    _.assign(this, data);
    this.CreationTime = this.getCreationTime();
  }

  getAutoScalingGroupName() {
    return this.getTag('aws:autoscaling:groupName');
  }

  persistTag(tag) {
    return amazonClientFactory.createEC2Client(this.AccountName)
    .then(client => new InstanceResourceBase(client))
    .then((instanceResource) => {
      let parameters = {
        instanceIds: [this.InstanceId],
        tagKey: tag.key,
        tagValue: tag.value
      };

      return instanceResource.setTag(parameters);
    });
  }

  getCreationTime() {
    return _.get(this, 'BlockDeviceMappings[0].Ebs.AttachTime');
  }

  static getById(instanceId) {
    function findInstanceInAccount({ AccountNumber }) {
      return amazonClientFactory.createEC2Client(AccountNumber)
      .then(client => new InstanceResourceBase(client))
      .then(instanceResource => instanceResource.all({ filter: { 'instance-id': instanceId } }))
      .then(instances => instances.map(instance => new TaggableInstance(instance)));
    }
    return scanCrossAccountFn(findInstanceInAccount).then(([head]) => head);
  }

  static getAllByEnvironment(environmentName) {
    return co(function* () {
      let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
      let startTime = moment.utc();
      return amazonClientFactory.createEC2Client(accountName)
        .then(client => new InstanceResourceBase(client))
        .then(instanceResource => instanceResource.all({ filter: { 'tag:Environment': environmentName } }))
        .then(instances => instances.map(instance => new TaggableInstance(instance)))
        .then((result) => {
          let duration = moment.duration(moment.utc().diff(startTime)).asMilliseconds();
          logger.debug(`server-status-query: InstancesQuery took ${duration}ms`);
          return result;
        });
    });
  }
}

class TaggableInstance extends TaggableMixin(Instance) { }

module.exports = TaggableInstance;


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
const asgResourceFactory = __webpack_require__(25);

function* handler(query) {
  // Create an instance of the resource to work with based on the resource
  // descriptor and AWS account name.
  let parameters = { accountName: query.accountName };
  let resource = yield asgResourceFactory.create(undefined, parameters);

  return resource.all({ names: query.autoScalingGroupNames });
}

module.exports = co.wrap(handler);


/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function InvalidOperationError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 63 */
/***/ (function(module, exports) {

module.exports = require("url");

/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let consulReporter = __webpack_require__(330);

/**
 * Service Discovery abstraction to allow easy switching
 * of service discovery frameworks.
 */
module.exports = consulReporter;


/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const ec2InstanceResourceFactory = __webpack_require__(83);

module.exports = function ScanInstancesQueryHandler({ accountName, filter }) {
  return ec2InstanceResourceFactory.create(undefined, { accountName })
    .then(x => x.all({ filter }));
};


/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const LOGICAL_TABLE_NAME = 'InfraConfigPermissions';
const TTL = 600; // seconds

let physicalTableName = __webpack_require__(13).getTableName;
let cachedSingleAccountDynamoTable = __webpack_require__(22);

module.exports = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });


/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let { attachAuditMetadata, updateAuditMetadata } = __webpack_require__(17);
let describeDynamoTable = __webpack_require__(68);
let { hashKeyAttributeName } = __webpack_require__(47);
let { makeWritable } = __webpack_require__(89);
let dynamoVersion = __webpack_require__(15);
let { softDelete } = __webpack_require__(156);
let fp = __webpack_require__(4);

function factory(physicalTableName, dynamoTable) {
  let tableDescriptionPromise = () => describeDynamoTable(physicalTableName);

  function create(item) {
    return tableDescriptionPromise().then(description =>
      fp.flow(
        makeWritable,
        attachAuditMetadata,
        record => ({ record }),
        dynamoVersion.compareAndSetVersionOnCreate(hashKeyAttributeName(description)),
        dynamoTable.create.bind(null, physicalTableName)
      )(item)
    );
  }

  function $delete(item, expectedVersion, { ConditionExpression } = {}) {
    let { key, metadata } = item;
    let keyExpresionPair = softDelete({ key, metadata, expectedVersion });
    if (ConditionExpression) {
      let { expressions } = keyExpresionPair;
      expressions.ConditionExpression = ['and', ConditionExpression, expressions.ConditionExpression];
    }
    return dynamoTable.update(physicalTableName, keyExpresionPair)
      .then(() => dynamoTable.delete(physicalTableName, { key }));
  }

  function get(key) {
    return dynamoTable.get(physicalTableName, key);
  }

  function put(item, expectedVersion) {
    return tableDescriptionPromise().then(description =>
      fp.flow(
        makeWritable,
        attachAuditMetadata,
        record => ({ record, expectedVersion }),
        dynamoVersion.compareAndSetVersionOnPut(hashKeyAttributeName(description)),
        dynamoTable.replace.bind(null, physicalTableName)
      )(item)
    );
  }

  function query(expression) {
    return dynamoTable.query(physicalTableName, expression);
  }

  function replace(item, expectedVersion) {
    return fp.flow(
      makeWritable,
      attachAuditMetadata,
      record => ({ record, expectedVersion }),
      dynamoVersion.compareAndSetVersionOnReplace,
      dynamoTable.replace.bind(null, physicalTableName)
    )(item);
  }

  function scan(expression) {
    return dynamoTable.scan(physicalTableName, expression);
  }

  function update(expression, expectedVersion) {
    return fp.flow(
        updateAuditMetadata,
        updateExpression => ({
          key: expression.key,
          expressions: { UpdateExpression: updateExpression },
          expectedVersion
        }),
        dynamoVersion.compareAndSetVersionOnUpdate,
        dynamoTable.update.bind(null, physicalTableName)
      )(expression);
  }

  return {
    create,
    delete: $delete,
    get,
    put,
    query,
    replace,
    scan,
    update
  };
}

module.exports = factory;


/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let { createLowLevelDynamoClient: DynamoDB } = __webpack_require__(16);
let memoize = __webpack_require__(88);

function describeTableArn(TableName) {
  return DynamoDB()
  .then(dynamo => dynamo.describeTable({ TableName }).promise())
  .then(({ Table }) => ({ Table }));
}

/**
 * @description Return a memoized description of a DynamoDB table
 * @param {string} TableName - The name of the table
 * @returns {object} - The table description
 */
let describe = memoize(describeTableArn);

module.exports = describe;


/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function expressionScope() {
  let valName = i => `:val${i}`;
  let expressionAttributeValues = {};
  let expressionAttributeNames = {};
  let i = 0;

  function nameExpressionAttributeValue(value) {
    let t = valName(i);
    i += 1;
    expressionAttributeValues[t] = value;
    return t;
  }

  function nameExpressionAttributeName(result, name) {
    if (typeof name === 'number') {
      let elt = `[${name}]`;
      return result === null ? elt : `${result}${elt}`;
    } else {
      let elt = `#${name}`;
      expressionAttributeNames[elt] = name;
      return result === null ? elt : `${result}.${elt}`;
    }
  }

  return {
    nameExpressionAttributeName,
    nameExpressionAttributeValue,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  };
}

function compileOne(scope, expr) {
  let compile = compileOne.bind(null, scope);
  let infix = ([fn, ...args]) => {
    let compiled = args.map(compile).join(` ${fn} `);
    return args.length === 1 ? compiled : `(${compiled})`;
  };
  let prefix = ([fn, ...args]) => `${fn}(${args.map(compile).join(', ')})`;
  let attr = ([, ...exprs]) => exprs.reduce(scope.nameExpressionAttributeName, null);
  let val = ([, ...exprs]) => exprs.map(value => scope.nameExpressionAttributeValue(value)).join(', ');
  let list = ([, sep, ...items]) => `${items.map(compile).join(sep)}`;
  let update = ([, ...args]) => {
    let assign = opargs => opargs.map(compile).join(' = ');
    let ref = opargs => opargs.map(compile).join(', ');
    let operatorCompiler = {
      add: assign,
      delete: ref,
      remove: ref,
      set: assign
    };
    let grouped = args.reduce((acc, [op, ...opargs]) => {
      let stmt = operatorCompiler[op](opargs);
      if (acc[op] === undefined) {
        acc[op] = stmt;
      } else {
        acc[op] += `, ${stmt}`;
      }
      return acc;
    }, {});
    return Object.keys(grouped).map(key => `${key.toUpperCase()} ${grouped[key]}`).join(' ');
  };
  let compilers = {
    '=': infix,
    '<>': infix,
    '<': infix,
    '<=': infix,
    '>': infix,
    '>=': infix,
    '+': infix,
    '-': infix,
    '/': infix,
    '*': infix,
    'and': infix,
    'at': attr,
    'attr': attr,
    'list': list,
    'or': infix,
    'update': update,
    'val': val
  };

  if (Array.isArray(expr) && expr.length > 0) {
    let [fn] = expr;
    let compiler = compilers[fn] || prefix;
    return compiler(expr);
  } else {
    return `${expr}`;
  }
}

function compileAll(expressions) {
  let scope = expressionScope();
  if (Array.isArray(expressions)) {
    return compileAll({ Expression: expressions }, scope);
  }
  let result = {};
  Object.keys(expressions).forEach((key) => {
    result[key] = compileOne(scope, expressions[key]);
  });
  ['ExpressionAttributeNames', 'ExpressionAttributeValues'].forEach(
    (key) => {
      if (Object.keys(scope[key]).length > 0) {
        result[key] = scope[key];
      }
    }
  );
  return Object.freeze(result);
}

module.exports = {
  compile: compileAll
};


/***/ }),
/* 70 */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



/* eslint-disable */
/**
 * TODO: This file is used across both client and server.
 * Not only is this a bad idea but it makes it impossible to lint.
 * We should refactor the shared aspects of this module.
 */

var User = function(data) {

  var _data = {
    name: null,
    expiration: 0
  };

  if(data) {
    _data.name       = data.name || null;
    _data.groups     = data.groups || [];
    _data.expiration = data.expiration || 0;
    _data.permissions = data.permissions || [];
  }

  this.getName = function() {
    return _data.name;
  };

  this.getExpiration = function() {
    return _data.expiration;
  };

  this.isAnonymous = function() {
    return !!_data.name;
  };

  this.getPermissions = function () {
    return _data.permissions;
  };

  this.hasPermission = function (requiredPermission) {
    return _data.permissions.some(function(userPermission) {
      if (userPermission.Resource && userPermission.Access) {
        var matchingResources = globIntersection(requiredPermission.resource.toLowerCase(), userPermission.Resource.toLowerCase());
        var matchingAccess = (userPermission.Access.toLowerCase() == requiredPermission.access.toLowerCase()) || userPermission.Access == 'ADMIN';

        if (matchingAccess && matchingResources) {
          return true;
        }
      }
    });
  };

  this.getGroups = function () {
    return _data.groups;
  };

  this.toString = function() {
    return [_data.name, _data.expiration].join('|');
  };

  this.toJson = function() {
    return _data;
  };

};

User.prototype.toString = function() { return 'User'; };

if(typeof module !== 'undefined' && module.exports) {

  module.exports = {

    anonymous: function() {
      return new User();
    },

    new: function(name, expiration, groups, permissions) {
      return new User({
        name: name,
        expiration: expiration,
        groups: groups,
        permissions: permissions
      });
    },

    parse: function(json) {
      if(!json) return new User();

      var user = new User({
        name: json.name,
        expiration: json.expiration,
        groups: json.groups,
        permissions: json.permissions
      });

      return user;
    }
  }
}

/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let config = __webpack_require__(5);

let cookieConfig;

module.exports = {
  getCookieName: () => {
    loadConfiguration();
    return cookieConfig.cookieName;
  },

  getCookieDuration: () => {
    loadConfiguration();
    return cookieConfig.cookieDuration;
  }
};

function loadConfiguration() {
  let localConfig = config.getUserValue('local');

  assert(localConfig.authentication, 'missing \'authentication\' field in configuration');
  assert(localConfig.authentication.cookieName, 'missing \'authentication.cookieName\' field in configuration');
  assert(localConfig.authentication.cookieDuration, 'missing \'authentication.cookieDuration\' field in configuration');

  cookieConfig = {
    loginUrl: localConfig.authentication.loginUrl,
    cookieName: localConfig.authentication.cookieName,
    cookieDuration: localConfig.authentication.cookieDuration
  };
}


/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let guid = __webpack_require__(41);

function createCommandId() {
  return guid();
}

function createTimestamp() {
  return new Date().toISOString();
}

function getUsername(user) {
  return user.getName();
}

function createFromParameters(parameters) {
  let command = Object.assign({}, parameters.command);

  // Why must we override these if they are already set?
  if (parameters.parent) {
    command.commandId = parameters.parent.commandId;
    command.username = parameters.parent.username;
  } else {
    command.commandId = createCommandId();
    command.username = getUsername(parameters.user);
  }

  command.timestamp = createTimestamp();
  return command;
}

function addMetadata(command) {
  // Why must we override these if they are already set?
  let overrides = {
    commandId: createCommandId(),
    username: getUsername(command.user),
    timestamp: createTimestamp()
  };

  let result = Object.assign({}, command, overrides);
  delete result.user;
  return result;
}

module.exports = {
  createFromParameters,
  addMetadata
};


/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let sender = __webpack_require__(6);
let Image = __webpack_require__(188);
let ImageNotFoundError = __webpack_require__(189);
let ScanCrossAccountImages = __webpack_require__(53);

module.exports = {

  get(imageIdNameOrType, includeUnstable) {
    assert(imageIdNameOrType, 'Expected "imageIdNameOrType" argument not to be null');
    if (imageIdNameOrType.toLowerCase().startsWith('ami')) {
      return getImage({ id: imageIdNameOrType });
    }

    if (doesSpecifyVersion(imageIdNameOrType)) {
      return getImage({ name: imageIdNameOrType });
    }

    let safeIncludeUnstable = includeUnstable === undefined ? false : includeUnstable;
    return getLatestImageByType(imageIdNameOrType, safeIncludeUnstable);
  }
};

function doesSpecifyVersion(imageIdNameOrType) {
  return imageIdNameOrType.match(/\-(\d+\.){2}\d+$/);
}

function getImage(params) {
  let filter = {};

  if (params.id) filter['image-id'] = params.id;
  if (params.name) filter.name = params.name;

  let query = { name: 'ScanCrossAccountImages', filter };

  return sender
    .sendQuery(ScanCrossAccountImages, { query })
    .then(amiImages =>
      (amiImages.length ?
        Promise.resolve(new Image(amiImages[0])) :
        Promise.reject(new ImageNotFoundError(`No AMI image "${params.id || params.name}" found.`))
      )
    );
}

function getLatestImageByType(imageType, includeUnstable) {
  let query = {
    name: 'ScanCrossAccountImages'
  };

  return sender
    .sendQuery(ScanCrossAccountImages, { query })
    .then((amiImages) => {
      let isLatest = includeUnstable ? image => image.IsLatest : image => image.IsLatestStable;
      let latestImage = amiImages.find(image => image.AmiType === imageType && isLatest(image));

      if (latestImage) {
        return new Image(latestImage);
      }

      throw new ImageNotFoundError(`No AMI image of type "${imageType}" found.`);
    });
}


/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function AutoScalingGroupNotFoundError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 76 */
/***/ (function(module, exports) {

module.exports = require("moment");

/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function HttpRequestError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);

let TaggableMixin = Base => class extends Base {
  getTag(key, defaultValue) {
    let tag = _.find(this.Tags, { Key: key });
    if (tag === undefined) {
      if (arguments.length <= 1) {
        throw new Error(`Can't find tag "${key}"`);
      } else {
        return defaultValue;
      }
    }
    return tag.Value;
  }

  setTag(key, value) {
    let tag = this.getTag(key);
    if (tag === undefined) {
      tag = {
        Key: key,
        Value: value
      };
      this.Tags.push(tag);
    } else {
      tag.Value = value;
    }
  }
};

module.exports = TaggableMixin;


/***/ }),
/* 79 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let serviceTargets = __webpack_require__(26);
let schema = __webpack_require__(109);

module.exports = function GetTargetState(query) {
  return co(function* () {
    yield schema('GetTargetStateQuery').then(x => x.assert(query));

    let key = query.key;
    let recurse = query.recurse;

    return yield serviceTargets.getTargetState(query.environment, { key, recurse });
  });
};


/***/ }),
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let awsAccounts = __webpack_require__(31);
let applyFuncToAccounts = __webpack_require__(101);

function scanCrossAccountFn(fn) {
  return awsAccounts.all()
    .then(accounts => applyFuncToAccounts(fn, accounts));
}

module.exports = scanCrossAccountFn;


/***/ }),
/* 81 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



// Note: considering simply operating on AWS data rather than mapping our structures
let _ = __webpack_require__(1);

const OS_DEVICE_NAME = '/dev/sda1';
const DATA_DEVICE_NAME = '/dev/sda2';

const DEFAULT_VOLUME = {
  Type: 'SSD',
  Size: 50
};

module.exports = {
  toAWS(volumes) {
    let awsVolumes = [];

    let osVolume = _.find(volumes, { Name: 'OS' }) || DEFAULT_VOLUME;
    let osDevice = getDeviceByVolume(osVolume, OS_DEVICE_NAME);
    awsVolumes.push(osDevice);

    let dataVolume = _.find(volumes, { Name: 'Data' }) || DEFAULT_VOLUME;
    if (dataVolume.Size !== 0) {
      let dataDevice = getDeviceByVolume(dataVolume, DATA_DEVICE_NAME, true);
      awsVolumes.push(dataDevice);
    }

    return awsVolumes;
  },
  // reverse function
  fromAWS(awsVolumes) {
    return awsVolumes.filter(vol =>
      _.includes([OS_DEVICE_NAME, DATA_DEVICE_NAME], vol.DeviceName)
    ).map((awsVolume) => {
      let volume = {};
      volume.Name = awsVolume.DeviceName === OS_DEVICE_NAME ? 'OS' : 'Data';
      volume.Size = awsVolume.Ebs.VolumeSize;
      volume.Type = awsVolume.Ebs.VolumeType === 'gp2' ? 'SSD' : 'Disk';
      return volume;
    }).sort((vol1, vol2) => (
      // sda1 before sda2 etc.
      vol1.Name < vol2.Name
    ));
  }
};

function getDeviceByVolume(dataVolume, name, encrypted) {
  return {
    DeviceName: name,
    Ebs: {
      DeleteOnTermination: true,
      VolumeSize: dataVolume.Size,
      VolumeType: dataVolume.Type.toLowerCase() === 'ssd' ? 'gp2' : 'standard',
      Encrypted: encrypted
    }
  };
}



/***/ }),
/* 82 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let _ = __webpack_require__(1);
const asgResourceFactory = __webpack_require__(25);
let InvalidOperationError = __webpack_require__(62);

function* handler(command) {
  // Validation
  let min = command.autoScalingGroupMinSize;
  let desired = command.autoScalingGroupDesiredSize;
  let max = command.autoScalingGroupMaxSize;

  if (!_.isNil(min)) {
    if (!_.isNil(max) && min > max) {
      throw new InvalidOperationError(
        `Provided Max size '${max}' must be greater than or equal to the Min size '${min}'.`
      );
    }

    if (!_.isNil(desired) && desired < min) {
      throw new InvalidOperationError(
        `Provided Desired size '${desired}' must be greater than or equal to the Min size '${min}'.`
      );
    }
  }

  if (!_.isNil(max)) {
    if (!_.isNil(min) && min > max) {
      throw new InvalidOperationError(
        `Provided Min size '${min}' must be less than or equal to the Max size '${max}'.`
      );
    }

    if (!_.isNil(desired) && desired > max) {
      throw new InvalidOperationError(
        `Provided Desired size '${desired}' must be less than or equal to the Max size '${max}'.`
      );
    }
  }

  // Get a resource instance to work with AutoScalingGroup in the proper
  // AWS account.
  let parameters = { accountName: command.accountName };
  let resource = yield asgResourceFactory.create(undefined, parameters);

  // Change the AutoScalingGroup size accordingly to the expected one.
  parameters = {
    name: command.autoScalingGroupName,
    minSize: command.autoScalingGroupMinSize,
    desiredSize: command.autoScalingGroupDesiredSize,
    maxSize: command.autoScalingGroupMaxSize
  };

  return resource.put(parameters);
}

module.exports = co.wrap(handler);


/***/ }),
/* 83 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let amazonClientFactory = __webpack_require__(14);
let Instance = __webpack_require__(60);
let InstanceResourceBase = __webpack_require__(115);

function instanceResource(client) {
  const instanceResourceBase = new InstanceResourceBase(client);
  const self = Object.create(instanceResourceBase);
  self.all = function all(parameters) {
    return instanceResourceBase.all(parameters).then(xs => xs.map(x => new Instance(x)));
  };
  return self;
}

module.exports = {
  canCreate: resourceDescriptor =>
    resourceDescriptor.type.toLowerCase() === 'ec2/instance',

  create: (_, { accountName } = {}) => amazonClientFactory.createEC2Client(accountName).then(instanceResource)
};


/***/ }),
/* 84 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let BaseError = __webpack_require__(7);

module.exports = class DeploymentValidationError extends BaseError {

  constructor(message, innerError) {
    super();
    this.name = this.constructor.name;
    this.message = message;
    this.innerError = innerError;

    Error.captureStackTrace(this, this.constructor);
  }

};


/***/ }),
/* 85 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let serviceTargets = __webpack_require__(26);
let _ = __webpack_require__(1);
let { createServerRoleFilter } = __webpack_require__(142);

function toRoleGroups(results) {
  let hash = _.groupBy(results, getRole);
  return Object.keys(hash).map(key => (
    {
      Role: key,
      Services: _.map(hash[key], 'value')
    }
  ));
}

function getRole(service) {
  let r = /roles\/(.*?)\//;
  let matches = r.exec(service.key);
  return matches[1];
}

function GetServerRoles({ environmentName, serviceName, slice, serverRole }) {
  let recurse = true;
  let key = `environments/${environmentName.toLowerCase()}/roles`;
  return serviceTargets.getTargetState(environmentName, { key, recurse })
    .then(results => ({
      EnvironmentName: environmentName,
      Value: toRoleGroups(results).filter(createServerRoleFilter({ serviceName, slice, serverRole }))
    }));
}

module.exports = GetServerRoles;


/***/ }),
/* 86 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



module.exports = {
  SUCCESS: 'Success',
  FAIL: 'Failed'
};


/***/ }),
/* 87 */
/***/ (function(module, exports) {

module.exports = require("newrelic");

/***/ }),
/* 88 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let deepFreeze = __webpack_require__(155);

function isPromise(obj) {
  return obj && obj.then && typeof obj.then === 'function';
}

function deepFreezeIfObj(obj) {
  let t = typeof obj;
  return ((t === 'object' || t === 'function') && t !== null)
    ? deepFreeze(obj)
    : obj;
}

function memoize(fn) {
  if (typeof fn !== 'function') {
    throw new Error('Can only memoize a function');
  }

  let memo = new Map();
  return (...args) => {
    let key = JSON.stringify(args);
    if (!memo.has(key)) {
      let result = fn(...args);
      if (isPromise(result)) {
        memo.set(key, result.then(deepFreezeIfObj));
      } else {
        memo.set(key, deepFreezeIfObj(result));
      }
    }
    return memo.get(key);
  };
}

module.exports = memoize;


/***/ }),
/* 89 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * Attach the duct-tape that keeps the wings on ;-)
 */



/**
 * Return a deep copy of item with only properties for which
 * filter returns true.
 * @param {function} filter
 * @param {*} item
 */
function recursivelyRemoveProperties(filter, item) {
  function loop(i) {
    if (typeof i !== 'object' || i === null) {
      return i;
    } else if (Array.isArray(i)) {
      return i.filter(filter.bind(null, null)).map(loop);
    } else if (i instanceof Date) {
      let t = new Date();
      t.setTime(i.getTime());
      return t;
    } else {
      return Object.keys(i).reduce((acc, key) => {
        let value = i[key];
        if (filter(key, value)) {
          acc[key] = loop(i[key]);
        }
        return acc;
      }, {});
    }
  }
  return loop(item);
}

/**
 * DynamoDB cannot store the empty string or undefined as property values
 * @param {string} name
 * @param {*} value
 */
function dynamoCanStoreProperty(name, value) {
  return value !== undefined && value !== '';
}

module.exports = {
  makeWritable: recursivelyRemoveProperties.bind(null, dynamoCanStoreProperty)
};


/***/ }),
/* 90 */
/***/ (function(module, exports) {

module.exports = require("ioredis");

/***/ }),
/* 91 */
/***/ (function(module, exports) {

module.exports = require("timers");

/***/ }),
/* 92 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */



let crypto = __webpack_require__(160);

const CIPHER_ALGORITHM = 'aes-256-gcm';
const CONTENT_LENGTH_BYTES = 32 / 8;
const HASH_ALGORITHM = 'sha256';
const ITERATIONS = 1000;
const KEY_LENGTH = 32;

function bufOfInt(i) {
  let buf = new Buffer(CONTENT_LENGTH_BYTES);
  buf.writeUInt32LE(i);
  return buf;
}

function pack(buffers) {
  let sizeThenContent = buf => [bufOfInt(buf.length), buf];
  return Buffer.concat(buffers.map(sizeThenContent).reduce((acc, nxt) => acc.concat(nxt), []));
}

function unpack(buffer) {
  let offset = 0;
  let output = [];
  while (offset < buffer.length) {
    let contentLength = buffer.readUInt32LE(offset);
    let contentStart = offset + CONTENT_LENGTH_BYTES;
    output.push(buffer.slice(contentStart, contentStart + contentLength));
    offset = offset + CONTENT_LENGTH_BYTES + contentLength;
  }
  return output;
}

function encrypt(key, plaintext) {
  if (!plaintext) {
    throw new Error(`plaintext must be a buffer: got ${plaintext}`);
  }

  let iv = crypto.randomBytes(12);
  let salt = crypto.randomBytes(16);
  let sessionKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, HASH_ALGORITHM);
  let cipher = crypto.createCipheriv(CIPHER_ALGORITHM, sessionKey, iv);
  let encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  let tag = cipher.getAuthTag();
  return pack([
    new Buffer(CIPHER_ALGORITHM, 'utf8'),
    new Buffer(HASH_ALGORITHM, 'utf8'),
    iv,
    salt,
    bufOfInt(ITERATIONS),
    bufOfInt(KEY_LENGTH),
    tag,
    encrypted]);
}

function decrypt(key, ciphertext) {
  if (!ciphertext) {
    throw new Error(`ciphertext must be a buffer: got ${ciphertext}`);
  }

  let parts = unpack(ciphertext);
  let cipherAlgorithm = parts[0].toString('utf8');
  let hashAlgorithm = parts[1].toString('utf8');
  let iv = parts[2];
  let salt = parts[3];
  let iterations = parts[4].readUInt32LE();
  let keyLength = parts[5].readUInt32LE();
  let tag = parts[6];
  let content = parts[7];
  let sessionKey = crypto.pbkdf2Sync(key, salt, iterations, keyLength, hashAlgorithm);
  let cipher = crypto.createDecipheriv(cipherAlgorithm, sessionKey, iv);
  cipher.setAuthTag(tag);
  let decrypted = cipher.update(content) + cipher.final();
  return decrypted;
}

module.exports = {
  decrypt,
  encrypt
};


/***/ }),
/* 93 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



/**
 * Remove verbose stuff from stack traces
 */

const FILE_LOCATION_REGEXP = /\((.*)(:[0-9]+:[0-9]+)\)/;
const LINE_FILTER_REGEXP = /^\s*at\s+/i;
const NOT_MY_CODE_REGEXP = /(node_modules)|(\([^\\\/]+:[0-9]+:[0-9]+\))|(\(native\))/;

const path = __webpack_require__(40);
const findInAncestor = __webpack_require__(46);

let isMyCode = line => !NOT_MY_CODE_REGEXP.test(line);

let enteredMyCode = (line, prev) => isMyCode(line) && !isMyCode(prev);
let exitedMyCode = (line, prev) => !isMyCode(line) && isMyCode(prev);
let inMyCode = (line, prev) => isMyCode(line) && isMyCode(prev);
let inOtherCode = (line, prev) => !isMyCode(line) && !isMyCode(prev);

function create({ contextLines, filePathTransform }) {
  function shorten(line) {
    return line.replace(FILE_LOCATION_REGEXP, (match, fullPath, location) => {
      let file = filePathTransform(fullPath);
      return `(${file}${location})`;
    }).replace();
  }

  function minimize(stack) {
    let lines = stack.split('\n')
      .filter(line => LINE_FILTER_REGEXP.test(line))
      .map(line => line.replace(LINE_FILTER_REGEXP, ''));
    let linesSkippedMessage = (omittedCount) => {
      let skipped = omittedCount - (2 * contextLines);
      return skipped > 0 ? [`...(${skipped} line${skipped > 1 ? 's' : ''} skipped)...`] : [];
    };
    function loop({ context, omittedCount, output, prev }, line) {
      if (enteredMyCode(line, prev)) {
        let skipped = linesSkippedMessage(omittedCount);
        return {
          context: [],
          omittedCount: 0,
          output: output.concat(skipped, context.map(shorten), shorten(line)),
          prev: line
        };
      } else if (exitedMyCode(line, prev)) {
        return {
          context: [],
          omittedCount: 1,
          output: contextLines ? output.concat(shorten(line)) : output,
          prev: line
        };
      } else if (inMyCode(line, prev)) {
        return {
          context: [],
          omittedCount: 0,
          output: output.concat(shorten(line)),
          prev: line
        };
      } else if (inOtherCode(line, prev)) {
        return {
          context: contextLines ? [line] : [],
          omittedCount: omittedCount + 1,
          output,
          prev: line
        };
      } else {
        throw new Error('This code path should be unreachable');
      }
    }
    let { context, omittedCount, output } = lines.reduce(loop, {
      context: [],
      omittedCount: 0,
      output: [],
      prev: undefined
    });
    let skipped = linesSkippedMessage(omittedCount);
    let rest = context.length > 0 ? skipped.concat(context.map(shorten)) : [];
    return output.concat(rest).join('\n');
  }

  return minimize;
}

create.build = () => {
  let basePath = path.dirname(findInAncestor('package.json', __dirname));
  let filePathTransform = fullPath => path.relative(basePath, fullPath);
  return create({ contextLines: 0, filePathTransform });
};

module.exports = create;


/***/ }),
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function ActiveDirectoryError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 95 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let EncryptedRedisStore = __webpack_require__(179);
const USER_SESSION_STORE_INDEX = 1;

let sessionStore;

function createSessionStore() {
  sessionStore = EncryptedRedisStore.createStore(USER_SESSION_STORE_INDEX);
  return sessionStore;
}

module.exports = {
  get: () => { return sessionStore || createSessionStore(); }
};


/***/ }),
/* 96 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let config = __webpack_require__(5);
const mock = __webpack_require__(180);
const prod = __webpack_require__(181);

let implementation;

if (config.get('IS_PRODUCTION')) {
  implementation = prod;
} else {
  implementation = mock;
}

module.exports = implementation;


/***/ }),
/* 97 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);

function S3GetObjectRequest(client, parameters) {
  assert(client, 'Invalid argument \'client\'.');
  assert(parameters, 'Invalid argument \'parameters\'.');
  assert(parameters.bucketName, 'Invalid argument \'parameters.bucketName\'.');
  assert(parameters.objectPath, 'Invalid argument \'parameters.objectPath\'.');

  let self = this;

  self.execute = function (callback) {
    let request = {
      Bucket: parameters.bucketName,
      Key: parameters.objectPath
    };

    let promise = client.getObject(request)
      .promise().then(data => data, (error) => {
        let message = `An error has occurred retrieving '${request.Key}' file from '${request.Bucket}' S3 bucket: ${error.message}`;
        throw new Error(message);
      });

    if (callback !== undefined) {
      promise.then(result => callback(null, result), error => callback(error));
      return undefined;
    } else {
      return promise;
    }
  };
}

module.exports = S3GetObjectRequest;


/***/ }),
/* 98 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let userService = __webpack_require__(50);
let cookieAuthenticationConfiguration = __webpack_require__(72);

module.exports = {
  middleware(req, res, next) {
    if (req.user) return next();

    let cookie = req.cookies[cookieAuthenticationConfiguration.getCookieName()];
    if (!cookie) return next();

    return userService.getUserByToken(cookie)
      .then((user) => {
        req.user = user;
        req.authenticatedBy = 'cookie';
        next();
      }, () => next());
  }
};


/***/ }),
/* 99 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let ms = __webpack_require__(42);
let _ = __webpack_require__(1);

let DEFAULT_SERVICE_INSTALLATION_TIMEOUT = '30m';

let Enums = __webpack_require__(11);
let BaseError = __webpack_require__(7);
let deployments = __webpack_require__(35);
let sender = __webpack_require__(6);
let infrastructureConfigurationProvider = __webpack_require__(52);
let namingConventionProvider = __webpack_require__(32);
let logger = __webpack_require__(2);
let Environment = __webpack_require__(9);
let GetAutoScalingGroup = __webpack_require__(56);
let GetTargetState = __webpack_require__(79);

module.exports = {

  all() {
    return co(function* () {
      let activeDeployments = yield getActiveDeploymentsFromHistoryTable();
      logger.debug(`DeploymentMonitor: ${activeDeployments.length} deployments found to monitor.`);

      return activeDeployments;
    }).catch((error) => {
      let message = (error instanceof BaseError) ? error.toString(true) : error.stack;
      logger.error(`DeploymentMonitor: An error has occurred getting active deployments: ${message}`);

      return Promise.reject(error);
    });
  },

  getActiveDeploymentsFullStatus(activeDeployments) {
    return Promise.all(activeDeployments.map(
      activeDeployment => getActiveDeploymentFullStatus(activeDeployment)
    ));
  }

};

function getActiveDeploymentsFromHistoryTable() {
  let FilterExpression = ['and',
    ['=', ['at', 'Value', 'SchemaVersion'], ['val', 2]],
    ['=', ['at', 'Value', 'Status'], ['val', 'In Progress']]
  ];
  return deployments.scanRunning({ FilterExpression });
}

function getActiveDeploymentFullStatus(activeDeployment) {
  let deploymentId = activeDeployment.DeploymentID;
  let environmentName = activeDeployment.Value.EnvironmentName;
  let serviceName = activeDeployment.Value.ServiceName;
  let serviceVersion = activeDeployment.Value.ServiceVersion;
  let accountName = activeDeployment.AccountName;

  return co(function* () {
    let data = yield {
      nodesId: getExpectedNodesIdByDeployment(activeDeployment),
      serviceInstallation: getTargetState(
        `environments/${environmentName}/services/${serviceName}/${serviceVersion}/installation`,
        environmentName,
        true
      ),
      nodesDeployment: getTargetState(
        `deployments/${deploymentId}/nodes/`,
        environmentName,
        true
      )
    };

    let nodesDeployment = getNodesDeployment(data.nodesId, data.nodesDeployment);
    let installationTimeout = data.serviceInstallation.length ? data.serviceInstallation[0].value.InstallationTimeout : DEFAULT_SERVICE_INSTALLATION_TIMEOUT;

    let activeDeploymentFullStatus = {
      deploymentId,
      environmentName,
      accountName,
      installationTimeout: ms(`${installationTimeout}m`),
      startTime: new Date(activeDeployment.Value.StartTimestamp),
      nodesDeployment
    };

    logger.debug(`DeploymentMonitor: Deployment '${deploymentId}' is going to affect following nodes ${JSON.stringify(nodesDeployment)}`);

    return activeDeploymentFullStatus;
  }).catch((error) => {
    let errorString = `An error has occurred getting deployment '${deploymentId}' status: ${error.toString(true)}`;
    logger.error(errorString);

    return Promise.resolve({
      deploymentId,
      error: errorString,
      environmentName,
      accountName
    });
  });
}

function getNodesDeployment(nodesId, nodesDeployment) {
  let mapping = nodesId.map((nodeId) => {
    let nodeDeployment = nodesDeployment
      .filter(x => x.key.indexOf(`/nodes/${nodeId}`) >= 0)
      .map(x => x.value)[0];

    let result = {
      InstanceId: nodeId,
      Status: Enums.NodeDeploymentStatus.NotStarted
    };

    if (!nodeDeployment) return result;

    for (let propertyName in nodeDeployment) {
      if ({}.hasOwnProperty.call(nodeDeployment, propertyName)) {
        let property = nodeDeployment[propertyName];
        if (!property) continue; // eslint-disable-line no-continue
        result[propertyName] = property;
      }
    }

    return result;
  });

  return mapping;
}

function getExpectedNodesIdByDeployment(deployment) {
  return co(function* () {
    let serverRoleName;
    if (deployment.Value.ServerRoleName === undefined) {
      let environment = yield Environment.getByName(deployment.Value.EnvironmentName);
      let deploymentMap = yield environment.getDeploymentMap();
      let serverRoles = _.map(yield deploymentMap.getServerRolesByServiceName(deployment.Value.ServiceName), 'ServerRoleName');
      serverRoleName = serverRoles[0];
      logger.info(`DeploymentMonitor: Picked deployment from old monitor: ${serverRoleName}`);
    } else {
      serverRoleName = deployment.Value.ServerRoleName;
    }

    let configuration = yield infrastructureConfigurationProvider.get(
      deployment.Value.EnvironmentName, deployment.Value.ServiceName, serverRoleName
    );

    let autoScalingGroupName = namingConventionProvider.getAutoScalingGroupName(
      configuration, deployment.Value.ServiceSlice
    );

    let query = {
      name: 'GetAutoScalingGroup',
      accountName: deployment.AccountName,
      autoScalingGroupName
    };

    try {
      let autoScalingGroup = yield sender.sendQuery(GetAutoScalingGroup, { query });
      let nodeIds = autoScalingGroup.Instances
        .filter(instance => instance.LifecycleState === 'InService')
        .map(instance => instance.InstanceId);
      return nodeIds;
    } catch (err) {
      logger.error('Couldn\'t find AutoScalingGroup - it\'s not in cached array?');
      logger.error(err);
      return [];
    }
  });
}

function getTargetState(key, environmentName, recurse) {
  let query = {
    name: 'GetTargetState',
    environment: environmentName,
    key,
    recurse
  };

  return sender.sendQuery(GetTargetState, { query });
}


/***/ }),
/* 100 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const LOGICAL_TABLE_NAME = 'InfraConfigAccounts';
const TTL = 600; // seconds

let physicalTableName = __webpack_require__(13).getTableName;
let cachedSingleAccountDynamoTable = __webpack_require__(22);

module.exports = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });


/***/ }),
/* 101 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let Promise = __webpack_require__(10);

function applyFuncToAccounts(fn, accounts) {
  function applyFnAndAssignAccountName({ AccountName, AccountNumber }) {
    return Promise.resolve({ AccountName, AccountNumber })
      .then(fn)
      .then((result = []) => result.map(item => (item !== null && typeof item === 'object'
        ? Object.assign(item, { AccountName })
        : item)));
  }
  return Promise.map(accounts, applyFnAndAssignAccountName)
    .then(results => [].concat(...results));
}

module.exports = applyFuncToAccounts;


/***/ }),
/* 102 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(4);
let { ChronoUnit, Clock, Instant } = __webpack_require__(30);
let semver = __webpack_require__(190);

let clock = Clock.systemUTC();

module.exports = {
  isCompatibleImage,
  isStable,
  getAmiType,
  getAmiVersion,
  getRootDevice,
  summaryOf,
  compare,
  rank,
  getStableDate
};

function isCompatibleImage(amiName) {
  // whatever-name-0.0.0
  return /^[a-zA-Z0-9.-]+-[0-9]+\.[0-9]+\.[0-9]+$/.test(amiName);
}

function daysBetween(selected, now) {
  try {
    return getStableDate(selected).until(now, ChronoUnit.DAYS);
  } catch (error) {
    return 0;
  }
}

function getAmiType(name) {
  let amiType = name;
  if (name && isCompatibleImage(name)) {
    let pos = name.lastIndexOf('-');
    if (pos) amiType = name.substr(0, pos);
  }

  return amiType;
}

function getAmiVersion(name) {
  let amiVersion = '';
  if (name && isCompatibleImage(name)) {
    let pos = name.lastIndexOf('-');
    if (pos) amiVersion = name.substr(pos + 1);
  }

  return amiVersion;
}

function getRootDevice(ec2image) {
  if (!ec2image.RootDeviceName) return null;
  if (!ec2image.BlockDeviceMappings) return null;

  let rootDevice = ec2image.BlockDeviceMappings.find(mapping =>
    mapping.DeviceName === ec2image.RootDeviceName
  );

  return rootDevice;
}

function summaryOf(ec2Image) {
  let name = ec2Image.Name;
  let rootDevice = getRootDevice(ec2Image);
  let tags = _.flow([_.map(tag => [tag.Key, tag.Value]), _.fromPairs])(ec2Image.Tags);
  let summary = {
    ImageId: ec2Image.ImageId,
    CreationDate: ec2Image.CreationDate,
    Platform: ec2Image.Platform ? 'Windows' : 'Linux',
    Name: name,
    Description: ec2Image.Description || '',
    AmiType: getAmiType(name),
    AmiVersion: getAmiVersion(name),
    IsCompatibleImage: isCompatibleImage(name),
    IsStable: isStable(ec2Image),
    Encrypted: _.get('Ebs.Encrypted')(rootDevice),
    RootVolumeSize: _.get('Ebs.VolumeSize')(rootDevice)
  };

  return Object.assign(tags, summary);
}

function compare(summaryImageX, summaryImageY) {
  if (summaryImageX && summaryImageY) {
    let x = comparable(summaryImageX);
    let y = comparable(summaryImageY);
    return (2 * Math.sign(x.amiType.localeCompare(y.amiType))) + Math.sign(semver.rcompare(x.amiVersion, y.amiVersion));
  } else if (summaryImageX) {
    return 1;
  } else if (summaryImageY) {
    return -1;
  } else {
    return 0;
  }
}

function rank(summaries) {
  let prev = { AmiType: null };
  let prevStable = { AmiType: null };
  let latestStable = { AmiType: null };
  let i = 0;
  for (let summary of summaries) {
    let isLatest = (summary.AmiType !== prev.AmiType);
    let isLatestStable = (summary.AmiType !== prevStable.AmiType && summary.IsStable);
    i = isLatest ? 1 : 1 + i;
    summary.Rank = i;
    summary.IsLatest = isLatest;
    summary.IsLatestStable = isLatestStable;
    summary.DaysBehindLatest = (summary.AmiType === latestStable.AmiType) ? daysBetween(prevStable, clock.instant()) : 0;
    prev = summary;
    if (summary.IsStable) {
      prevStable = summary;
    }
    if (isLatestStable) {
      latestStable = summary;
    }
  }

  return summaries;
}

function comparable(summary) {
  return {
    amiType: summary.AmiType || '',
    amiVersion: semver.valid(summary.AmiVersion) || '0.0.0'
  };
}

function isStable(ec2Image) {
  let hasStableTag = ec2Image.Tags && ec2Image.Tags.some(t => t.Key.toLowerCase() === 'stable' && t.Value !== '');
  let hasStableInDescription = ec2Image.Description && ec2Image.Description.toLowerCase() === 'stable';
  return !!((hasStableTag || hasStableInDescription));
}

function getStableTagValue(ec2image) {
  if (!ec2image.Tags) {
    return null;
  }

  let stableTag = ec2image.Tags.find(t => t.Key.toLowerCase() === 'stable');
  if (!stableTag) {
    return null;
  }

  try {
    return Instant.parse(stableTag.Value);
  } catch (e) {
    if (e.name === 'DateTimeParseException') {
      return null;
    }
    throw e;
  }
}

function getStableDate(ec2image) {
  let stableTagValue = getStableTagValue(ec2image);
  if (!stableTagValue) {
    return Instant.parse(ec2image.CreationDate);
  }

  return stableTagValue;
}


/***/ }),
/* 103 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let amazonClientFactory = __webpack_require__(14);
let awsAccounts = __webpack_require__(31);
let cacheManager = __webpack_require__(34);
let fp = __webpack_require__(4);

const USE_CACHE = true;

function getImagesVisibleToAccount(accountId, filter) {
  function getImagesOwners() {
    return awsAccounts.getAMIsharingAccounts()
      .then(accounts => _.uniq(accounts.concat(accountId))
        .map(acc => _.padStart(acc, 12, '0')));
  }

  function buildRequest(query) {
    let Filters = [];
    if (query) {
      // {a:1, b:2} => [{Name:'a', Values:[1]}, {Name:'b', Values:[2]}]
      Filters = _.toPairs(query).map(q => ({ Name: q[0], Values: _.concat(q[1]) }));
    }

    Filters.push({ Name: 'state', Values: ['available'] });
    Filters.push({ Name: 'is-public', Values: ['false'] });
    Filters.push({ Name: 'image-type', Values: ['machine'] });

    return getImagesOwners().then(Owners => ({ Filters, Owners }));
  }

  let ec2ClientPromise = amazonClientFactory.createEC2Client(accountId);

  return Promise.all([ec2ClientPromise, buildRequest(filter)])
    .then(([client, request]) => client.describeImages(request).promise())
    .then(data => data.Images);
}

const imagesCache = cacheManager.create('ImagesCache', getImagesVisibleToAccount, { stdTTL: 30 * 60 });

function ImageResource(account) {
  let accountId = _.toString(account.AccountNumber);

  function cachedGetAll(params) {
    let hasFilter = fp.flow(fp.get('filter'), fp.toPairs, x => x.length > 0);

    if (hasFilter(params) || !USE_CACHE) {
      return getImagesVisibleToAccount(accountId, params.filter);
    } else {
      return imagesCache.get(accountId);
    }
  }

  this.all = cachedGetAll;
}

function create(resourceDescriptor, parameters) {
  return awsAccounts.getByName(parameters.accountName)
  .then(account => new ImageResource(account));
}

function canCreate(resourceDescriptor) {
  return resourceDescriptor.type.toLowerCase() === 'ec2/image';
}

module.exports = {
  canCreate,
  create
};


/***/ }),
/* 104 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const LOGICAL_TABLE_NAME = 'ConfigDeploymentMaps';
const TTL = 600; // seconds

let physicalTableName = __webpack_require__(13).getTableName;
let cachedSingleAccountDynamoTable = __webpack_require__(22);

module.exports = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });


/***/ }),
/* 105 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const LOGICAL_TABLE_NAME = 'InfraConfigClusters';
const TTL = 3600; // seconds

let physicalTableName = __webpack_require__(13).getTableName;
let cachedSingleAccountDynamoTable = __webpack_require__(22);

module.exports = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });


/***/ }),
/* 106 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let co = __webpack_require__(0);
let amazonClientFactory = __webpack_require__(14);
let AwsError = __webpack_require__(33);
let AutoScalingGroupNotFoundError = __webpack_require__(75);
let AutoScalingGroupAlreadyExistsError = __webpack_require__(194);
let cacheManager = __webpack_require__(34);
let fp = __webpack_require__(4);
let logger = __webpack_require__(2);
let pages = __webpack_require__(49);

function getAllAsgsInAccount(accountId, names) {
  logger.debug(`Describing all ASGs in account "${accountId}"...`);
  let request = (names && names.length) ? { AutoScalingGroupNames: names } : {};
  let asgDescriptions = amazonClientFactory.createASGClient(accountId)
    .then(client => pages.flatten(page => page.AutoScalingGroups, client.describeAutoScalingGroups(request)));
  return asgDescriptions;
}

let asgCache = cacheManager.create('Auto Scaling Groups', getAllAsgsInAccount, { stdTTL: 60 });

function AsgResourceBase(accountId) {
  let asgClient = () => amazonClientFactory.createASGClient(accountId);

  function standardifyError(error, autoScalingGroupName) {
    if (!error) return null;
    let awsError = new AwsError(error.message);
    if (error.message.indexOf('AutoScalingGroup name not found') >= 0) {
      return new AutoScalingGroupNotFoundError(`AutoScalingGroup "${autoScalingGroupName}" not found.`, awsError);
    }

    if (error.code === 'AlreadyExists') {
      let message = `AutoScalingGroup "${autoScalingGroupName}" already exists.`;
      return new AutoScalingGroupAlreadyExistsError(message, awsError);
    }

    return awsError;
  }

  function describeAutoScalingGroups(names) {
    let predicate = (() => {
      if (names && names.length) {
        let nameSet = new Set(names);
        return asg => nameSet.has(asg.AutoScalingGroupName);
      } else {
        return () => true;
      }
    })();

    return asgCache.get(accountId).then(fp.filter(predicate));
  }

  this.get = function (parameters) {
    if (parameters.clearCache === true) {
      asgCache.del(accountId);
    }
    return describeAutoScalingGroups([parameters.name]).then((result) => {
      if (result.length > 0) return result[0];
      throw new AutoScalingGroupNotFoundError(`AutoScalingGroup "${parameters.name}" not found.`);
    }).catch((error) => {
      throw new AwsError(error.message);
    });
  };

  this.all = function (parameters) {
    return describeAutoScalingGroups(parameters.names);
  };

  this.setTag = function (parameters) {
    let request = {
      Tags: [{
        Key: parameters.tagKey,
        PropagateAtLaunch: true,
        ResourceId: parameters.name,
        ResourceType: 'auto-scaling-group',
        Value: parameters.tagValue
      }]
    };
    return asgClient().then(client => client.createOrUpdateTags(request).promise()).catch((error) => {
      throw standardifyError(error, parameters.name);
    });
  };

  this.delete = function ({ name, force }) {
    logger.warn(`Deleting Auto Scaling Group "${name}"`);
    return asgClient().then(client => client.deleteAutoScalingGroup({ AutoScalingGroupName: name, ForceDelete: force }).promise());
  };

  function updateASG(client, parameters) {
    let request = {
      AutoScalingGroupName: parameters.name
    };

    if (!_.isNil(parameters.minSize)) {
      request.MinSize = parameters.minSize;
    }

    if (!_.isNil(parameters.desiredSize)) {
      request.DesiredCapacity = parameters.desiredSize;
    }

    if (!_.isNil(parameters.maxSize)) {
      request.MaxSize = parameters.maxSize;
    }

    if (parameters.launchConfigurationName) {
      request.LaunchConfigurationName = parameters.launchConfigurationName;
    }

    if (!_.isNil(parameters.subnets)) {
      request.VPCZoneIdentifier = parameters.subnets.join(',');
    }

    return client.updateAutoScalingGroup(request).promise();
  }

  function updateLCHs(client, parameters) {
    let request = {
      AutoScalingGroupName: parameters.name,
      LifecycleHookName: '10min-draining'
    };

    if (_.isNil(parameters.scaling)) return Promise.resolve();

    if (!parameters.scaling.terminationDelay) {
      return client.deleteLifecycleHook(request).promise().catch(() => {});
    }

    Object.assign(request, {
      HeartbeatTimeout: parameters.scaling.terminationDelay * 60,
      LifecycleTransition: 'autoscaling:EC2_INSTANCE_TERMINATING',
      DefaultResult: 'CONTINUE'
    });

    return client.putLifecycleHook(request).promise();
  }

  this.put = (parameters) => {
    asgCache.del(accountId);
    return co(function* () {
      let client = yield asgClient();
      yield updateASG(client, parameters);
      yield updateLCHs(client, parameters);
    }).catch((error) => {
      throw standardifyError(error, parameters.name);
    });
  };

  this.enterInstancesToStandby = (parameters) => {
    let request = {
      AutoScalingGroupName: parameters.name,
      ShouldDecrementDesiredCapacity: true,
      InstanceIds: parameters.instanceIds
    };
    return asgClient().then(client => client.enterStandby(request).promise());
  };

  this.exitInstancesFromStandby = (parameters) => {
    let request = {
      AutoScalingGroupName: parameters.name,
      InstanceIds: parameters.instanceIds
    };
    return asgClient().then(client => client.exitStandby(request).promise());
  };

  this.post = request => asgClient().then(client => client.createAutoScalingGroup(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.attachLifecycleHook = request => asgClient().then(client => client.putLifecycleHook(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.attachNotifications = request => asgClient().then(client => client.putNotificationConfiguration(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.describeScheduledActions = request => asgClient().then(client => client.describeScheduledActions(request).promise().then(result => result.ScheduledUpdateGroupActions).catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.describeLifeCycleHooks = request => asgClient().then(client => client.describeLifecycleHooks(request).promise().then(result => result.ScheduledUpdateGroupActions).catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.deleteScheduledAction = request => asgClient().then(client => client.deleteScheduledAction(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.createScheduledAction = request => asgClient().then(client => client.putScheduledUpdateGroupAction(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));
}

module.exports = AsgResourceBase;


/***/ }),
/* 107 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let {
  setInstanceMaintenanceMode
} = __webpack_require__(195);

let {
  getTargetState,
  setTargetState,
  removeTargetState,
  removeRuntimeServerRoleTargetState,
  getAllServiceTargets,
  getServiceDeploymentCause,
  getInstanceServiceDeploymentInfo
} = __webpack_require__(201);

module.exports = {
  getTargetState,
  setTargetState,
  removeTargetState,
  removeRuntimeServerRoleTargetState,
  setInstanceMaintenanceMode,
  getAllServiceTargets,
  getServiceDeploymentCause,
  getInstanceServiceDeploymentInfo
};


/***/ }),
/* 108 */
/***/ (function(module, exports) {

module.exports = require("retry");

/***/ }),
/* 109 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let fs = __webpack_require__(27);
let path = __webpack_require__(40);
let Ajv = __webpack_require__(110);
let Promise = __webpack_require__(10);
const findInAncestor = __webpack_require__(46);

const readFile = Promise.promisify(fs.readFile);

function loadSchema(schemaId, callback) {
  return readFile(findInAncestor(path.join('schemas', `${schemaId}.json`), __dirname), 'utf-8')
    .then(text => JSON.parse(text))
    .asCallback(callback);
}

const options = {
  allErrors: true,
  format: 'fast',
  loadSchema
};

const ajv = new Ajv(options);
const compileAsync = Promise.promisify(ajv.compileAsync.bind(ajv));

function validator(schemaId) {
  return getSchema(schemaId).then((validate) => {
    let test = (value) => {
      if (validate(value)) {
        return [null, value];
      } else {
        let errors = validate.errors;
        return [errors];
      }
    };

    let assert = (value) => {
      if (validate(value)) {
        return true;
      } else {
        let errors = validate.errors;
        throw new Error(JSON.stringify(errors, null, 4));
      }
    };

    return {
      assert,
      test
    };
  });
}

function getSchema(schemaId) {
  let validate = ajv.getSchema(schemaId);
  return validate
    ? Promise.resolve(validate)
    : loadSchema(schemaId).then(schema => compileAsync(schema));
}

module.exports = validator;


/***/ }),
/* 110 */
/***/ (function(module, exports) {

module.exports = require("ajv");

/***/ }),
/* 111 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let { appendLogEntries } = __webpack_require__(35);
let logger = __webpack_require__(2);
let timer = __webpack_require__(91);

module.exports = function DeploymentLogsStreamer() {
  let pendingLogEntries = (() => {
    let state = new Map();
    return {
      add: (deploymentId, message) => {
        if (!state.has(deploymentId)) {
          state.set(deploymentId, []);
        }
        state.get(deploymentId).push(message);
      },
      deploymentIds: () => Array.from(state.keys()),
      getByDeploymentId: deploymentId => state.get(deploymentId) || [],
      removeByDeploymentId: deploymentId => state.delete(deploymentId)
    };
  })();

  function logWriteErrors(result) {
    if (result.error) {
      logger.error(result.error);
      logger.error(`Failed to flush pending log entries for deployment ${result.deploymentId}:
${result.logEntries.join('\n')}`);
    }
    return result;
  }

  function flushPendingLogEntries(deploymentId) {
    let key = { DeploymentID: deploymentId };

    let logEntries = pendingLogEntries.getByDeploymentId(deploymentId);
    pendingLogEntries.removeByDeploymentId(deploymentId);
    return appendLogEntries({ logEntries, key })
      .then(() => ({ deploymentId }))
      .catch(error => logWriteErrors({ deploymentId, logEntries, error }));
  }

  timer.setInterval(() => {
    let promises = pendingLogEntries.deploymentIds().map(flushPendingLogEntries);
    Promise.all(promises).catch(
      (error) => {
        logger.error(`An error has occurred streaming logs to DynamoDB: ${error.message}`);
      }
    );
  }, 1000);

  this.log = (deploymentId, message) => {
    let timestamp = new Date().toISOString();
    pendingLogEntries.add(deploymentId, `[${timestamp}] ${message}`);
  };

  this.flush = flushPendingLogEntries;
};


/***/ }),
/* 112 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let serviceTargets = __webpack_require__(26);
let schema = __webpack_require__(109);
let DeploymentLogsStreamer = __webpack_require__(111);
let deploymentLogsStreamer = new DeploymentLogsStreamer();

module.exports = function UpdateTargetState(command) {
  let { deploymentId, key, options, value } = command;
  return schema('UpdateTargetStateCommand')
    .then(x => x.assert(command))
    .then(() => deploymentLogsStreamer.log(deploymentId, `Updating key ${command.key}`))
    .then(() => serviceTargets.setTargetState(command.environment, { key, value, options }));
};


/***/ }),
/* 113 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let configurationCache = __webpack_require__(57);
let deployments = __webpack_require__(35);
let fp = __webpack_require__(4);
let { Clock, Instant, LocalDate, ZoneId } = __webpack_require__(30);
let sender = __webpack_require__(6);
let GetTargetState = __webpack_require__(79);
const Deployment = __webpack_require__(216);

function getTargetAccountName(deployment) {
  return configurationCache.getEnvironmentTypeByName(fp.get(['Value', 'EnvironmentType'])(deployment))
    .then(fp.get(['AWSAccountName']));
}

function mapDeployment(deployment) {
  const environmentName = deployment.Value.EnvironmentName;
  const deploymentID = deployment.DeploymentID;
  const accountName = deployment.AccountName;

  return co(function* () {
    let expectedNodes;
    try {
      let serviceDeployment = yield getServiceDeploymentDefinition(environmentName, deploymentID, accountName);
      if (Array.isArray(serviceDeployment)) {
        serviceDeployment = serviceDeployment[0];
      }
      if (serviceDeployment !== undefined) {
        expectedNodes = serviceDeployment.value.ExpectedNodeDeployments;
      }
    } catch (error) {
      expectedNodes = undefined;
    }

    if (deployment.Value.Status.toLowerCase() !== 'in progress') {
      return new Deployment(deployment, expectedNodes);
    }

    let nodes = yield queryDeploymentNodeStates(environmentName, deploymentID, accountName);
    deployment.Value.Nodes = nodes.map(mapNode);
    return new Deployment(deployment, expectedNodes);
  });
}

function mapNode(node) {
  let resultNode = node.value;
  let r = /.*\/(.*)$/g;
  resultNode.InstanceId = r.exec(node.key)[1];
  return resultNode;
}

function queryDeployment({ key }) {
  return deployments.get({ DeploymentID: key })
    .then((result) => {
      if (result === null) {
        return null;
      } else {
        return getTargetAccountName(result).then((accountName) => {
          result.AccountName = accountName;
          if (Array.isArray(result.Value.ExecutionLog)) {
            result.Value.ExecutionLog = result.Value.ExecutionLog.join('\n');
          }
          return result;
        });
      }
    });
}

function queryDeployments(query) {
  let expressions = (() => {
    function predicate(attribute, value) {
      if (value === undefined) {
        return null;
      } else {
        return ['=', ['at', ...attribute], ['val', value]];
      }
    }

    let filter = [
      predicate(['Value', 'EnvironmentName'], query.environment),
      predicate(['Value', 'Status'], query.status),
      predicate(['Value', 'OwningCluster'], query.cluster)
    ].filter(x => x !== null);

    if (filter.length === 0) {
      return {};
    } else if (filter.length === 1) {
      return { FilterExpression: filter[0] };
    } else {
      return { FilterExpression: ['and', ...filter] };
    }
  })();

  let now = Instant.now(Clock.systemUTC());
  let startOfToday = LocalDate.ofInstant(now, ZoneId.UTC).atStartOfDay().toInstant(ZoneId.UTC);
  let startDate = query.since instanceof Date
    ? Instant.ofEpochMilli(query.since)
    : startOfToday;
  let endDate = now;
  return deployments.queryByDateRange(startDate, endDate, expressions);
}

function getServiceDeploymentDefinition(environment, key, accountName) {
  let consulQuery = {
    name: 'GetTargetState',
    key: `deployments/${key}/service`,
    accountName,
    environment,
    recurse: true
  };

  return sender.sendQuery(GetTargetState, { query: consulQuery });
}

function queryDeploymentNodeStates(environment, key, accountName) {
  let consulQuery = {
    name: 'GetTargetState',
    key: `deployments/${key}/nodes`,
    accountName,
    environment,
    recurse: true
  };

  return sender.sendQuery(GetTargetState, { query: consulQuery });
}

module.exports = {

  get: query => queryDeployment(query).then(x => (x !== null ? mapDeployment(x) : null)),

  scan: query => queryDeployments(query)
    .then((results) => {
      let deploymentsWithNodes = results.map(mapDeployment);
      return Promise.all(deploymentsWithNodes);
    })
};


/***/ }),
/* 114 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let configCache = __webpack_require__(57);

const SCHEDULE_ENVIRONMENT = 'SCHEDULE_ENVIRONMENT';

function getEnvironmentType(environmentName) {
  return co(function* () {
    let environment = yield configCache.getEnvironmentByName(environmentName);
    return configCache.getEnvironmentTypeByName(environment.EnvironmentType);
  });
}

function* isActionProtected(environmentName, action) {
  let envType = yield getEnvironmentType(environmentName);
  let protectedActions = envType.ProtectedActions || [];
  return protectedActions.indexOf(action) !== -1;
}

module.exports = {
  SCHEDULE_ENVIRONMENT,
  isActionProtected: co.wrap(isActionProtected)
};


/***/ }),
/* 115 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let _ = __webpack_require__(1);
let InstanceNotFoundError = __webpack_require__(220);

function InstanceResource(client) {
  function flatInstances(data) {
    let instances = reservation => reservation.Instances;
    return _(data.Reservations).map(instances).compact().flatten().value();
  }

  function buildRequest(query) {
    if (!query) return {};

    // {a:1, b:2} => [{Name:'a', Values:[1]}, {Name:'b', Values:[2]}]
    let Filters = _.toPairs(query).map(q => ({ Name: q[0], Values: _.castArray(q[1]) }));
    return { Filters };
  }

  this.all = function (parameters) {
    let request = buildRequest(parameters.filter);
    let instances = [];

    function query() {
      return client.describeInstances(request).promise().then((data) => {
        instances = instances.concat(flatInstances(data));

        if (!data.NextToken) {
          return _.map(instances);
        }

        // Scan from next index
        request.NextToken = data.NextToken;
        return query(client);
      });
    }

    return query(client);
  };

  this.setTag = function (parameters) {
    let request = {
      Resources: parameters.instanceIds,
      Tags: [
        {
          Key: parameters.tagKey,
          Value: parameters.tagValue
        }
      ]
    };

    return client.createTags(request).promise().catch((error) => {
      throw standardifyError(error);
    });
  };

  function standardifyError(error) {
    if (!error) return null;

    return new InstanceNotFoundError(error.message);
  }
}

module.exports = InstanceResource;


/***/ }),
/* 116 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let servicesDb = __webpack_require__(28);

class Service {

  constructor(data) {
    _.assign(this, data);
  }

  static getByName(name) {
    return servicesDb.get({ ServiceName: name })
      .then(obj => (obj ? new Service(obj) : null));
  }
}

module.exports = Service;


/***/ }),
/* 117 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const yaml = __webpack_require__(228);
const fs = __webpack_require__(27);
const findInAncestor = __webpack_require__(46);

const apiSpec = yaml.safeLoad(fs.readFileSync(findInAncestor('swagger.yaml', __dirname), 'utf8'));

module.exports = apiSpec;


/***/ }),
/* 118 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const LOGICAL_TABLE_NAME = 'InfraAsgIPs';

let { createDynamoClient: DocumentClient } = __webpack_require__(14);
let { getTableName: physicalTableName } = __webpack_require__(13);

const commonParams = Object.freeze({ TableName: physicalTableName(LOGICAL_TABLE_NAME) });

function get(account, key) {
  let params = Object.assign({ Key: key }, commonParams);
  return DocumentClient(account)
    .then(dynamo => dynamo.get(params).promise())
    .then(({ Item }) => Item);
}

function put(account, item) {
  let params = Object.assign({ Item: item }, commonParams);
  return DocumentClient(account)
    .then(dynamo => dynamo.put(params).promise());
}

module.exports = {
  get,
  put
};


/***/ }),
/* 119 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let sender = __webpack_require__(6);
let TaggableMixin = __webpack_require__(78);
let ScanSecurityGroups = __webpack_require__(237);

class SecurityGroup {
  constructor(data) {
    _.assign(this, data);
  }

  getName() {
    return this.getTag('Name');
  }

  static getAllByIds(accountName, vpcId, groupIds) {
    let query = {
      name: 'ScanSecurityGroups',
      accountName,
      vpcId,
      groupIds
    };

    return sender.sendQuery(ScanSecurityGroups, { query }).then(list => list.map(item => new TaggableSecurityGroup(item)));
  }

  static getAllByNames(accountName, vpcId, groupNames) {
    let query = {
      name: 'ScanSecurityGroups',
      accountName,
      vpcId,
      groupNames
    };

    return sender.sendQuery(ScanSecurityGroups, { query }).then(list => list.map(item => new TaggableSecurityGroup(item)));
  }
}

class TaggableSecurityGroup extends TaggableMixin(SecurityGroup) { }

module.exports = TaggableSecurityGroup;


/***/ }),
/* 120 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let SecurityGroup = __webpack_require__(119);
let _ = __webpack_require__(1);

/**
 * These returns SecurityGroups in format
 * [ {Id, Name} ] where Id is AWS Secuity Group Id, and Name is a Tag:Name of an AWS Security Group
 */
module.exports = {

  getFromSecurityGroupNames(accountName, vpcId, securityGroupNamesAndReasons, logger) {
    let securityGroupNames = [];
    let securityGroupNamesAndReasonsMapping = {};

    securityGroupNamesAndReasons.forEach((group) => {
      securityGroupNames.push(group.name);
      securityGroupNamesAndReasonsMapping[group.name] = group.reason;
    });

    return SecurityGroup.getAllByNames(accountName, vpcId, securityGroupNames)
      .then(securityGroups =>
        getAndVerifyAllExpectedSecurityGroups(securityGroups, vpcId, securityGroupNamesAndReasonsMapping, logger)
      );
  },

  getFromConfiguration(configuration, image, accountName, logger) {
    assert(configuration, 'Expected "configuration" argument not to be null');
    assert(image, 'Expected "image" argument not to be null');
    assert(accountName, 'Expected "accountName" argument not to be null');

    let vpcId = configuration.environmentType.VpcId;
    let securityGroupNamesAndReasons = getSecurityGroupsNamesAndReasons(configuration, image);

    return this.getFromSecurityGroupNames(accountName, vpcId, securityGroupNamesAndReasons, logger);
  }

};

function getAndVerifyAllExpectedSecurityGroups(securityGroups, vpcId, securityGroupNamesAndReasonsMapping) {
  for (let securityGroupName in securityGroupNamesAndReasonsMapping) {
    if ({}.hasOwnProperty.call(securityGroupNamesAndReasonsMapping, securityGroupName)) {
      let found = _.find(securityGroups, sg => sg.getName() === securityGroupName);
      if (found === undefined) {
        throw new Error(`Security group "${securityGroupName}" not found in "${vpcId}" VPC. ${
          securityGroupNamesAndReasonsMapping[securityGroupName]}`
        );
      }
    }
  }

  return securityGroups;
}

function getSecurityGroupsNamesAndReasons(configuration, image) {
  let cluster = configuration.cluster;
  let imagePlatform = image.platform;
  let securityZone = configuration.serverRole.SecurityZone;
  let serverRoleName = configuration.serverRole.ServerRoleName;
  let customSecurityGroups = configuration.serverRole.SecurityGroups || [];

  let securityGroupNamesAndReasons = [];

  if (customSecurityGroups.length) {
    customSecurityGroups.forEach(group => securityGroupNamesAndReasons.push({
      name: group,
      reason: 'It is assigned because specified in the server role configuration.'
    }));
  } else {
    securityGroupNamesAndReasons.push({
      name: getSecurityGroupNameByServerRole(cluster, serverRoleName),
      reason: 'It is assigned by default given server role and cluster. It can be overwritten ' +
              'by specifying one or more security groups in the server role configuration.'
    });
  }

  if (securityZone === 'Secure') {
    securityGroupNamesAndReasons.push({
      name: getSecurityGroupNameBySecurityZone(securityZone),
      reason: 'It is assigned by default because server role security zone is Secure.'
    });

    securityGroupNamesAndReasons.push({
      name: getSecurityGroupNameByPlatformSecure(image, securityZone),
      reason: `It is assigned by default because instances image is ${imagePlatform} based in ` +
              'Secure security zone.'
    });
  } else {
    securityGroupNamesAndReasons.push({
      name: getSecurityGroupNameByPlatform(image, securityZone),
      reason: `It is assigned by default because instances image is ${imagePlatform} based.`
    });
  }

  return securityGroupNamesAndReasons;
}


function getSecurityGroupNameByPlatform(image) {
  return `sgOS${image.platform}`;
}

function getSecurityGroupNameByPlatformSecure(image) {
  return `sgOS${image.platform}Secure`;
}

function getSecurityGroupNameByServerRole(cluster, serverRoleName) {
  return `sgRole${cluster.Name}${serverRoleName}`;
}

function getSecurityGroupNameBySecurityZone(securityZone) {
  return `sgZone${securityZone}`;
}


/***/ }),
/* 121 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const iamInstanceProfileResourceFactory = __webpack_require__(242);

module.exports = function GetInstanceProfile(query) {
  let parameters = { accountName: query.accountName };
  return iamInstanceProfileResourceFactory.create(undefined, parameters).then(resource =>
    resource.get({ instanceProfileName: query.instanceProfileName })
  );
};


/***/ }),
/* 122 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let co = __webpack_require__(0);
let ConfigurationError = __webpack_require__(36);
let _ = __webpack_require__(1);

const SECURE_SECURITY_ZONE = 'Secure';

module.exports = {
  get(configuration) {
    assert(configuration, 'Expected "configuration" argument not to be null.');

    return co(function* () {
      let subnetTypeName = configuration.serverRole.SubnetTypeName;
      validateSubnetType(configuration);
      let subnets = yield getSubnetsByAvailabilityZone(subnetTypeName, configuration);
      return subnets;
    }).catch((error) => {
      throw new ConfigurationError(
            `Error retrieving subnet from "${configuration.environmentTypeName}": ${error.message}`);
    });
  }
};

function validateSubnetType(configuration) {
  let securityZone = configuration.serverRole.SecurityZone;
  let subnetTypeName = configuration.serverRole.SubnetTypeName;

  let subnetType = configuration.environmentType.Subnets[subnetTypeName];

  if (subnetType === undefined) {
    throw new Error(`Couldn't find Subnet Type ${subnetTypeName} in environment type config`);
  }

  if (securityZone === SECURE_SECURITY_ZONE && subnetType.Secure !== true) {
    throw new Error(`Can't use insecure subnet type "${subnetTypeName}" to deploy to Server Role with Security Zone "Secure"`);
  }
}

function getSubnetsByAvailabilityZone(subnetTypeName, configuration) {
  let subnetType = configuration.environmentType.Subnets[subnetTypeName];
  if (!subnetType) {
    throw new Error(`"${subnetTypeName}" subnet type not found`);
  }

  let availabilityZoneName = (configuration.serverRole.AvailabilityZoneName || '*');
  let subnets = [];

  if (availabilityZoneName === '*') {
    subnets = [subnetType.AvailabilityZoneA, subnetType.AvailabilityZoneB, subnetType.AvailabilityZoneC,
      subnetType.AvailabilityZoneD, subnetType.AvailabilityZoneE, subnetType.AvailabilityZoneF];
  } else {
    let azs = _.toArray(availabilityZoneName);
    azs.forEach((az) => {
      let name = az.toUpperCase();
      switch (name) {
        case 'A':
          subnets.push(subnetType.AvailabilityZoneA);
          break;
        case 'B':
          subnets.push(subnetType.AvailabilityZoneB);
          break;
        case 'C':
          subnets.push(subnetType.AvailabilityZoneC);
          break;
        case 'D':
          subnets.push(subnetType.AvailabilityZoneD);
          break;
        case 'E':
          subnets.push(subnetType.AvailabilityZoneE);
          break;
        case 'F':
          subnets.push(subnetType.AvailabilityZoneF);
          break;
        default:
          throw new Error(`Unknown "${name}" availability zone specified in configuration. ` +
            'Please specify one of the following values: "A", "B", "C" or "*".');
      }
    });
  }

  subnets = _.compact(subnets);

  if (subnets.some(subnet => !subnet.trim())) {
    throw new Error(`"${subnetTypeName}" subnet type does not contain the expected availability zones.`);
  }

  return subnets;
}


/***/ }),
/* 123 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const buffer = __webpack_require__(260);
const base64 = 'base64';
const utf8 = 'utf8';

let decode = str => JSON.parse(new buffer.Buffer(str, base64).toString(utf8));

let encode = obj => new buffer.Buffer(JSON.stringify(obj), utf8).toString(base64);

module.exports = {
  decode,
  encode
};


/***/ }),
/* 124 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const LOGICAL_TABLE_NAME = 'InfraConfigLBSettings';
const TTL = 600; // seconds

let { getTableName: physicalTableName } = __webpack_require__(13);
let cachedSingleAccountDynamoTable = __webpack_require__(22);

module.exports = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });


/***/ }),
/* 125 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const logicalTableNames = {
  accounts: 'InfraConfigAccounts',
  clusters: 'InfraConfigClusters',
  deploymentmaps: 'ConfigDeploymentMaps',
  environments: 'ConfigEnvironments',
  environmenttypes: 'ConfigEnvironments',
  lbsettings: 'InfraConfigLBSettings',
  lbupstream: 'InfraConfigLBUpstream',
  permissions: 'InfraConfigPermissions',
  services: 'InfraConfigServices'
};

function logicalTableName(entityTypeName) {
  return logicalTableNames[entityTypeName];
}

module.exports = logicalTableName;


/***/ }),
/* 126 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let S3GetObjectRequest = __webpack_require__(97);
let amazonClientFactory = __webpack_require__(14);
let sender = __webpack_require__(6);
let GetTargetState = __webpack_require__(79);

function getNode({ deploymentId, instanceId, accountName, environment }) {
  let query = {
    name: 'GetTargetState',
    key: `deployments/${deploymentId}/nodes/${instanceId}`,
    accountName,
    environment,
    recurse: false
  };

  return sender.sendQuery(GetTargetState, { query }).then((node) => {
    let s3Details = parseBucketAndPathFromS3Url(node.value.Log);
    return fetchS3Object(accountName, s3Details);
  }, (error) => {
    if (error.message.match(/Key.*has not been found/)) {
      throw new Error(`The service deployment ${deploymentId} hasn\'t started on instance ${instanceId}.`);
    } else throw error;
  });
}

function fetchS3Object(account, s3Details) {
  return amazonClientFactory.createS3Client(account).then((client) => {
    let s3Request = new S3GetObjectRequest(client, s3Details);
    return s3Request.execute()
      .then(result => result.Body.toString());
  });
}

function parseBucketAndPathFromS3Url(url) {
  let r = /:\/\/(.*?)\..*?\/(.*)\?/g;
  let matches = r.exec(url);

  if (matches) {
    return {
      bucketName: matches[1],
      objectPath: matches[2]
    };
  } else {
    return null;
  }
}

module.exports = getNode;


/***/ }),
/* 127 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let sender = __webpack_require__(6);
let ToggleTargetStatus = __webpack_require__(283);

function toggleServiceStatus({ environment, service, slice, enable, serverRole, user }) {
  const name = 'ToggleTargetStatus';
  const command = { name, environment, service, slice, enable, serverRole };
  return sender.sendCommand(ToggleTargetStatus, { user, command });
}

module.exports = {
  toggleServiceStatus
};


/***/ }),
/* 128 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



/* Defines functions to locate a package in S3 given its name, version and (optionally) environment
 */

let config = __webpack_require__(5);
let fp = __webpack_require__(4);
let masterAccountClient = __webpack_require__(16);
let s3Url = __webpack_require__(129);

const EM_PACKAGES_BUCKET = config.get('EM_PACKAGES_BUCKET');
const EM_PACKAGES_KEY_PREFIX = config.get('EM_PACKAGES_KEY_PREFIX');

function key({ environment, service, version }) {
  let dynamicParts = [service, version, environment].filter(x => x !== undefined);
  let keyPathParts = [
    EM_PACKAGES_KEY_PREFIX,
    dynamicParts,
    `${dynamicParts.join('-')}.zip`
  ];
  return fp.flow(fp.flatten, fp.filter(x => x !== undefined), fp.join('/'))(keyPathParts);
}

/**
 * Format an object as an S3 URL.
 * @param {Object} packageRef - an object with string properties service, version and (optionally) environment.
 * @returns {Object} an S3 location with string properties Bucket and Key.
 */
function exactLocation(packageRef) {
  return {
    Bucket: EM_PACKAGES_BUCKET,
    Key: key(packageRef)
  };
}

/**
 * Format an object as an S3 URL.
 * @param {Object} packageRef - an object with string properties service, version and environment.
 * @returns {Array} An array of S3 locations, each with string properties Bucket and Key.
 */
function s3GetLocations(packageRef) {
  let matches = [
    x => x,
    fp.omit('environment')
  ];
  return fp.flow(fp.map(x => exactLocation(x(packageRef))), fp.uniq)(matches);
}

function findDownloadUrl(packageRef) {
  let locations = s3GetLocations(packageRef);
  return masterAccountClient.createS3Client()
    .then((s3) => {
      function getUrlIfObjectExists(location) {
        let rq = s3.headObject(location);
        return rq.promise().then(
          () => s3Url.format(location, rq.httpRequest.region),
          error => (error.statusCode === 404 ? Promise.resolve() : Promise.reject(error))
        );
      }

      return Promise.all(locations.map(getUrlIfObjectExists))
        .then(results => results.find(x => x));
    });
}

module.exports = {
  findDownloadUrl,
  s3GetLocations,
  s3PutLocation: exactLocation
};


/***/ }),
/* 129 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

/**
 * @typedef {Object} S3Location
 * @property {string} endpoint
 * @property {string} Bucket
 * @property {string} Key
 * @property {string|undefined} VersionId
 */



const AWS = __webpack_require__(29);
const fp = __webpack_require__(4);

let encodeKey = fp.flow(fp.split('/'), fp.map(encodeURIComponent), fp.join('/'));

let decodeKey = fp.flow(fp.split('/'), fp.map(decodeURIComponent), fp.join('/'));

/**
 * Parse a string as an S3 object URL.
 * @param {string} url - the URL that refers to the S3 object.
 * @returns {S3Location|undefined} The parsed S3 location.
 */
function parse(url) {
  function parseBucketInPath() {
    let regex = /^(https?:\/\/s3\.?[^\/\.]+\.amazonaws\.com)\/([^\/]+)\/([^\?]+)(?:\?versionId=([^&]+))?$/;
    let t = regex.exec(url);
    if (t === null) {
      return undefined;
    }
    return {
      endpoint: t[1],
      Bucket: t[2],
      Key: decodeKey(t[3]),
      VersionId: t[4]
    };
  }

  function parseBucketInHostname() {
    let regex = /^(https?:\/\/)([^\.]+)\.(s3\.?[^\/\.]+\.amazonaws\.com)\/([^\?]+)(?:\?versionId=([^&]+))?$/;
    let t = regex.exec(url);
    if (t === null) {
      return undefined;
    }
    return {
      endpoint: t[1] + t[3],
      Bucket: t[2],
      Key: decodeKey(t[4]),
      VersionId: t[5]
    };
  }

  return parseBucketInPath() || parseBucketInHostname();
}

/**
 * Format an object as an S3 URL.
 * @param {string} s3location - an object with string properties Bucket, Key and (optionally) VersionId.
 * @returns {string} the URL that refers to the S3 object.
 */
function format(s3location, region) {
  let s3 = new AWS.S3({ region });
  let versionId = x => (x.VersionId ? `?versionId=${x.VersionId}` : '');
  return `${s3.endpoint.href}${s3location.Bucket}/${encodeKey(s3location.Key)}${versionId(s3location)}`;
}

/**
 * Get the object at the S3 URL.
 * @param {string} url - the URL that refers to the S3 object.
 * @param {Object} options - additional options to the AWS.S3 constructor.
 * @returns {ReadableStream} A readable stream of the object data.
 */
function getObject(url, options) {
  let params = parse(url);
  if (params === undefined) {
    throw new Error(`The URL is not a valid S3 object or object version URL: ${url}`);
  }
  let opts = Object.assign({}, options || {}, fp.pick(['endpoint'])(params));
  let getObjectArgs = Object.assign({}, fp.compose(fp.pick(['Bucket', 'Key', 'VersionId']), fp.omitBy(fp.isUndefined))(params));
  let request = new AWS.S3(opts).getObject(getObjectArgs);
  return request.createReadStream();
}

module.exports = {
  format,
  getObject,
  parse
};


/***/ }),
/* 130 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let scheduling = __webpack_require__(131);
let Environment = __webpack_require__(9);
let co = __webpack_require__(0);
let opsEnvironment = __webpack_require__(45);

class OpsEnvironment {

  constructor(data) {
    _.assign(this, data);
  }

  getScheduleStatus(date) {
    let env = this.Value;
    return scheduling.expectedStateFromSchedule(env, date).toUpperCase();
  }

  toAPIOutput() {
    let self = this;
    return co(function* () { // eslint-disable-line func-names
      let value = _.pick(self.Value, 'ManualScheduleUp', 'ScheduleAutomatically', 'DeploymentsLocked');
      value.InMaintenance = self.Value.EnvironmentInMaintenance;

      let accountName = yield Environment.getAccountNameForEnvironment(self.EnvironmentName);
      value.AccountName = accountName;

      let ret = {
        EnvironmentName: self.EnvironmentName,
        Value: value
      };

      ret.Value.ScheduleStatus = self.getScheduleStatus();
      return ret;
    });
  }

  isNothing() {
    return Object.keys(this).length === 0;
  }

  static getAll() {
    return opsEnvironment.scan()
      .then(list => list.map(env => new OpsEnvironment(env)));
  }

  static getByName(environmentName) {
    return opsEnvironment.get({ EnvironmentName: environmentName })
      .then(obj => new OpsEnvironment(obj));
  }
}

module.exports = OpsEnvironment;


/***/ }),
/* 131 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



/* eslint-disable */

const _ = __webpack_require__(1);
const parseSchedule = __webpack_require__(291);
const later = __webpack_require__(132);
const moment = __webpack_require__(292);

const actions = {
  switchOn: 'switchOn',
  switchOff: 'switchOff',
  putInService: 'putInService',
  putOutOfService: 'putOutOfService',
  skip: 'skip'
};

const sources = {
  instance: 'instance',
  asg: 'asg',
  environment: 'environment'
};

const skipReasons = {
  noEnvironment: 'This instance has no environment',
  explicitNoSchedule: 'The schedule tag for this instance is set to "noschedule"',
  invalidSchedule: 'The schedule tag for this instance is not valid',
  transitioning: 'This instance is currently transitioning between states',
  asgTransitioning: 'This instance is currently transitioning between ASG lifecycle states',
  asgLifecycleMismatches: 'The ASG has instances in different lifecycle states',
  maintenanceMode: 'This instance is currently in Maintenance Mode',
  stateIsCorrect: 'The instance is already in the correct state'
};

const states = {
  on: 'on',
  off: 'off'
};

const lifeCycleStates = {
  inService: 'InService',
  outOfService: 'Standby'
};

const currentStates = {
  on: 'on',
  off: 'off',
  transitioning: 'transitioning'
};

function actionsForAutoScalingGroup(autoScalingGroup, instances, dateTime) {

  autoScalingGroup.Environment = getTagValue(autoScalingGroup, 'Environment');

  mergeAsgInstances(autoScalingGroup, instances);

  if (autoScalingGroup.Instances.some(i => currentStateOfInstance(i._instance) == currentStates.transitioning))
    return [];

  if (!autoScalingGroup.Environment) {
    return skipAll(autoScalingGroup, skipReasons.noEnvironment);
  }

  let foundSchedule = getScheduleFromTag(autoScalingGroup);

  let source = foundSchedule.source;
  let parseResult = foundSchedule.parseResult;

  if (!parseResult.success) {
    return skipAll(autoScalingGroup, `${skipReasons.invalidSchedule} - Error: '${parseResult.error}'`, source);
  }

  let schedule = parseResult.schedule;

  if (schedule.skip) {

    // TODO: Check for any instances that might have schedules, this should fallback on to actionForInstance

    return skipAll(autoScalingGroup, skipReasons.explicitNoSchedule);
  }

  let localTime = convertToTimezone(dateTime, parseResult.timezone);
  let expectedState = expectedStateFromParsedSchedule(schedule, localTime);

  if (expectedState.noSchedule) {
    return skipAll(autoScalingGroup, skipReasons.stateIsCorrect);
  }

  var expectedNumberOfServers = 0;

  if (expectedState === states.on) {
    expectedNumberOfServers = autoScalingGroup.MaxSize;
  } else if (expectedState === states.off) {
    expectedNumberOfServers = autoScalingGroup.MinSize;
  } else {
    expectedNumberOfServers = Number(expectedState);
  }

  var actions = [];

  if (expectedNumberOfServers < calculateNumberOfServersRunning(autoScalingGroup)) {
    var numberOfServersToSwitchOff = calculateNumberOfServersRunning(autoScalingGroup) - expectedNumberOfServers
    actions = [...switchOffAsg(numberOfServersToSwitchOff, autoScalingGroup)];
  } else if (expectedNumberOfServers > calculateNumberOfServersInService(autoScalingGroup)) {
    var numberOfServersToSwitchOn = expectedNumberOfServers - calculateNumberOfServersInService(autoScalingGroup);
    actions = [...switchOnAsg(numberOfServersToSwitchOn, autoScalingGroup)];
  } else {
    actions = skipAll(autoScalingGroup, skipReasons.stateIsCorrect);
  }

  return actions;
}

function calculateNumberOfServersRunning(autoScalingGroup) {
  var distributionSet = getAsgDistributionSet(autoScalingGroup);
  var numberOfServersRunning = findInstancesWhere(distributionSet, autoScalingGroup.Instances.length, (instance) => currentStateOfInstance(instance._instance) == currentStates.on);
  return numberOfServersRunning.length;
}

function calculateNumberOfServersInService(autoScalingGroup) {
  var distributionSet = getAsgDistributionSet(autoScalingGroup);
  var numberOfServersInService = findInstancesWhere(distributionSet, autoScalingGroup.Instances.length, (instance) => instance.LifecycleState == lifeCycleStates.inService);
  return numberOfServersInService.length;
}

function getAsgDistributionSet(autoScalingGroup) {
  var results = {};
  autoScalingGroup.AvailabilityZones.sort()
  for (var availabilityZone of autoScalingGroup.AvailabilityZones) {
    results[availabilityZone] = [];
  }
  for (var instance of autoScalingGroup.Instances) {
    results[instance.AvailabilityZone].push(instance);
    results[instance.AvailabilityZone].sort((a, b) => {
      if (a.InstanceId > b.InstanceId) return 1;
      if (a.InstanceId < b.InstanceId) return -1;
      if (a.InstanceId === b.InstanceId) return 0;
    });
  }
  return results;
}

function findInstancesWhere(distributionSet, numberOfServers, instancePredicate) {
  var instancesFound = [];
  for (var availabilityZone of Object.keys(distributionSet)) {
    for (var instance of distributionSet[availabilityZone]) {
      if (instancePredicate(instance) && instancesFound.length !== numberOfServers)
        instancesFound.push(instance);
    }
  }
  return instancesFound;
}

function switchOffAsg(numberOfServersToSwitchOff, autoScalingGroup) {

  var distributionSet = getAsgDistributionSet(autoScalingGroup);

  var actions = [];

  var outOfServiceButRunningInstances = findInstancesWhere(distributionSet, numberOfServersToSwitchOff, (instance) =>
    instance.LifecycleState == lifeCycleStates.outOfService && currentStateOfInstance(instance._instance) == currentStates.on);

  var inServiceInstances = findInstancesWhere(distributionSet, numberOfServersToSwitchOff - outOfServiceButRunningInstances.length, (instance) =>
    instance.LifecycleState == lifeCycleStates.inService);

  for (var instance of [...outOfServiceButRunningInstances, ...inServiceInstances]) {
    var action = getActionResult(switchOff(instance._instance),  getInstanceInfo(instance._instance));
    actions.push(action);
  }

  return actions;
}

function getActionResult(action, instanceInfo) {
  return { action: action, instance: instanceInfo };
}

function switchOnAsg(numberOfServersToSwitchOn, autoScalingGroup) {
  var distributionSet = getAsgDistributionSet(autoScalingGroup);

  var actions = [];

  var inServiceInstances = findInstancesWhere(distributionSet, numberOfServersToSwitchOn, (instance) =>
    instance.LifecycleState == lifeCycleStates.outOfService && currentStateOfInstance(instance._instance) == currentStates.on);

  var outOfServiceAndSwitchedOffInstances = findInstancesWhere(distributionSet, numberOfServersToSwitchOn - inServiceInstances.length, (instance) =>
    instance.LifecycleState == lifeCycleStates.outOfService && currentStateOfInstance(instance._instance) == currentStates.off);

  for (var instance of [...inServiceInstances, ...outOfServiceAndSwitchedOffInstances]) {
    var action = getActionResult(switchOn(instance._instance),  getInstanceInfo(instance._instance));
    actions.push(action);
  }

  return actions;

}

function mergeAsgInstances(autoScalingGroup, instances) {
  for (var instanceIndex in autoScalingGroup.Instances) {
    var currentInstance = autoScalingGroup.Instances[instanceIndex];
    var emInstance = instances.filter(x => x.InstanceId === currentInstance.InstanceId)[0];
    currentInstance._instance = emInstance;
  }
}

function actionForInstance(instance, dateTime) {

  if (!instance.Environment) {
    return getActionResult(skip(skipReasons.noEnvironment), getInstanceInfo(instance));
  }

  if (isInMaintenanceMode(instance)) {
    return getActionResult(skip(skipReasons.maintenanceMode), getInstanceInfo(instance));
  }

  let foundSchedule = getScheduleFromTag(instance);

  let source = foundSchedule.source;
  let parseResult = foundSchedule.parseResult;

  if (!parseResult.success) {
    return getActionResult(skip(`${skipReasons.invalidSchedule} - Error: '${parseResult.error}'`, source),  getInstanceInfo(instance));
  }

  let schedule = parseResult.schedule;

  if (schedule.skip) {
    return getActionResult(skip(skipReasons.explicitNoSchedule, source),  getInstanceInfo(instance));
  }

  let localTime = convertToTimezone(dateTime, parseResult.timezone);
  let expectedState = expectedStateFromParsedSchedule(schedule, localTime);

  if (expectedState.noSchedule) {
    return getActionResult(skip(skipReasons.stateIsCorrect), getInstanceInfo(instance));
  }

  if (expectedState === states.on) {
    return getActionResult(switchOn(instance, source), getInstanceInfo(instance));
  }

  return getActionResult(switchOff(instance, source), getInstanceInfo(instance));
}

function expectedStateFromSchedule(schedule, dateTime) {
  let parsedSchedule =
    isEnvironmentSchedule(schedule) ?
      parseEnvironmentSchedule(schedule) :
      parseSchedule(schedule);

  if (!parsedSchedule.success) {
    return 'INVALID SCHEDULE';
  }

  if (parsedSchedule.schedule.skip) {
    return 'NO SCHEDULE';
  }

  let localTime = convertToTimezone(dateTime, parsedSchedule.timezone);
  let expectedState = expectedStateFromParsedSchedule(parsedSchedule.schedule, localTime);

  if (expectedState.noSchedule) {
    return 'NOT FOUND';
  }

  return expectedState;
}

function isEnvironmentSchedule(schedule) {
  let environmentScheduleProperties = ['DefaultSchedule', 'ManualScheduleUp', 'ScheduleAutomatically'];
  return _.some(environmentScheduleProperties, p => schedule[p] !== undefined);
}

function switchOn(instance, source) {
  let currentState = currentStateOfInstance(instance);

  if (currentState === currentStates.off) {
    return takeAction(actions.switchOn, source);
  }

  if (currentState === currentStates.transitioning) { return skip(skipReasons.transitioning); }

  if (instance.AutoScalingGroup) {
    let lifeCycleState = getAsgInstanceLifeCycleState(instance);

    if (lifeCycleState === lifeCycleStates.outOfService) {
      return takeAction(actions.putInService, source);
    }

    if (lifeCycleState === lifeCycleStates.transitioning) {
      return skip(skipReasons.asgTransitioning);
    }
  }

  return skip(skipReasons.stateIsCorrect, source);
}

function switchOff(instance, source) {
  if (instance.AutoScalingGroup) {
    let lifeCycleState = getAsgInstanceLifeCycleState(instance);

    if (lifeCycleState === lifeCycleStates.inService) {
      return takeAction(actions.putOutOfService, source);
    }

    if (lifeCycleState === lifeCycleStates.transitioning) {
      return skip(skipReasons.asgTransitioning);
    }
  }

  let currentState = currentStateOfInstance(instance);

  if (currentState === currentStates.on) {
    return takeAction(actions.switchOff, source);
  }

  if (currentState === currentStates.transitioning) {
    return skip(skipReasons.transitioning);
  }

  return skip(skipReasons.stateIsCorrect, source);
}

function isInMaintenanceMode(instance) {
  let maintenanceModeTagValue = getTagValue(instance, 'maintenance');
  return maintenanceModeTagValue && maintenanceModeTagValue.toLowerCase() === 'true';
}

function getAsgInstanceLifeCycleState(instance) {
  let asgInstanceEntry = _.first(instance.AutoScalingGroup.Instances.filter(i => i.InstanceId.toLowerCase() === instance.InstanceId.toLowerCase()));

  if (asgInstanceEntry) {
    if (asgInstanceEntry.LifecycleState === 'Standby') return lifeCycleStates.outOfService;
    if (asgInstanceEntry.LifecycleState === 'InService') return lifeCycleStates.inService;
  }

  return lifeCycleStates.transitioning;
}

function getScheduleFromTag(instance) {
  let instanceSchedule = getTagValue(instance, 'schedule');
  if (instanceSchedule) return { parseResult: parseSchedule(instanceSchedule), source: sources.instance };

  if (instance.AutoScalingGroup) {
    let asgSchedule = getTagValue(instance.AutoScalingGroup, 'schedule');
    if (asgSchedule) return { parseResult: parseSchedule(asgSchedule), source: sources.asg };
  }

  return { parseResult: parseEnvironmentSchedule(instance.Environment), source: sources.environment };
}

function parseEnvironmentSchedule(environmentSchedule) {
  if (environmentIsScheduledOff(environmentSchedule)) {
    return { success: true, schedule: { permanent: states.off } };
  }

  if (environmentIsScheduledOn(environmentSchedule)) {
    return { success: true, schedule: { permanent: states.on } };
  }

  return parseSchedule(environmentSchedule.DefaultSchedule);
}

function environmentIsScheduledOff(schedule) {
  return schedule.ManualScheduleUp === false && schedule.ScheduleAutomatically === false;
}

function environmentIsScheduledOn(schedule) {
  return !(schedule.ManualScheduleUp !== true && schedule.ScheduleAutomatically === true);
}

function expectedStateFromParsedSchedule(schedules, dateTime) {
  if (schedules.permanent) {
    return schedules.permanent;
  }

  let scheduleStates = schedules.map((schedule) => {
    return {
      dateTime: later.schedule(schedule.recurrence).prev(1, dateTime),
      state: schedule.state
    };
  });

  let latest = _.maxBy(scheduleStates, scheduleState => scheduleState.dateTime);

  if (latest.dateTime === 0) { return { noSchedule: true }; }

  return latest.state;
}

function convertToTimezone(dateTime, timezone) {
  let matchingZoneTime = moment.tz(dateTime, 'utc').tz(timezone || 'utc').format('YYYY-MM-DDTHH:mm:ss');
  return `${matchingZoneTime}Z`;
}

function getTagValue(instance, tagName) {
  if (instance.Tags) {
    let tag = _.first(instance.Tags.filter(t => t.Key.toLowerCase() === tagName.toLowerCase()));
    return (tag && tag.Value) ? tag.Value.trim() : undefined;
  }
  return undefined;
}

function currentStateOfInstance(instance) {
  if (!instance || !instance.State) return currentStates.transitioning;
  if (instance.State.Name === 'running') return currentStates.on;
  if (instance.State.Name === 'stopped') return currentStates.off;

  return currentStates.transitioning;
}

function skip(reason, source) {
  return { action: actions.skip, reason, source };
}

function skipAll(autoScalingGroup, reason, source) {
  var actions = [];
  for (var instanceIndex in autoScalingGroup.Instances) {
    var currentInstance = autoScalingGroup.Instances[instanceIndex];

    var result = { action: skip(reason, source), instance: getInstanceInfo(currentInstance._instance || currentInstance) };
    actions.push(result);
  }
  return actions;
}

function takeAction(action, source) {
  return { action, source };
}

function getInstanceInfo(instance) {
  let instanceVM = {
    id: instance.InstanceId,
    name: getTagValue(instance, 'name'),
    role: getTagValue(instance, 'role'),
    environment: getTagValue(instance, 'environment')
  };
  if (instance.AutoScalingGroup) {
    instanceVM.asg = instance.AutoScalingGroup.AutoScalingGroupName;
  }
  return instanceVM;
}

module.exports = {
  actions,
  sources,
  skipReasons,
  states,
  actionForInstance,
  actionsForAutoScalingGroup,
  expectedStateFromSchedule
};


/***/ }),
/* 132 */
/***/ (function(module, exports) {

module.exports = require("later");

/***/ }),
/* 133 */
/***/ (function(module, exports) {

module.exports = require("http");

/***/ }),
/* 134 */
/***/ (function(module, exports) {

module.exports = require("https");

/***/ }),
/* 135 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let fp = __webpack_require__(4);
let co = __webpack_require__(0);

let getInstanceState = __webpack_require__(136);
let getServicesState = __webpack_require__(333);
let getAWSInstances = __webpack_require__(334);

let AutoScalingGroup = __webpack_require__(19);
let logger = __webpack_require__(2);
let Environment = __webpack_require__(9);
let Enums = __webpack_require__(11);
let DIFF_STATE = Enums.DIFF_STATE;
let HEALTH_STATUS = Enums.HEALTH_STATUS;

// Services with 'Extra' diff state are present on some instances, but not in target state, typically because they're Ignored
function getServicesSummary(services) {
  let expected = _.filter(services, (service) => {
    let diff = service.DiffWithTargetState;
    return diff !== DIFF_STATE.Unexpected && diff !== DIFF_STATE.Ignored;
  });

  let expectedAndHealthy = _.filter(expected, s => s.OverallHealth === HEALTH_STATUS.Healthy);

  let unexpected = _.filter(services, { DiffWithTargetState: DIFF_STATE.Unexpected });
  let missing = _.filter(services, { DiffWithTargetState: DIFF_STATE.Missing });
  let ignored = _.filter(services, { DiffWithTargetState: DIFF_STATE.Ignored });

  return {
    AllExpectedServicesPresent: missing.length === 0,
    AllExpectedServicesHealthy: expectedAndHealthy.length === expected.length,
    ServicesCount: {
      Expected: expected.length,
      Unexpected: unexpected.length,
      Missing: missing.length,
      Ignored: ignored.length
    },
    ExpectedServices: fp.map(fp.pick(['Name', 'Slice', 'Version']), expected),
    MissingServices: fp.map(fp.pick(['Name', 'Slice', 'Version']), missing)
  };
}

function getASGState(environmentName, asgName) {
  return co(function* () {
    const accountName = yield (yield Environment.getByName(environmentName)).getAccountName();
    let asg = yield AutoScalingGroup.getByName(accountName, asgName);

    let instancesIds = _.map(asg.Instances, 'InstanceId');
    let instances = yield getAWSInstances(accountName, instancesIds);

    let instancesStates = yield _.map(instances, (instance) => {
      // Fresh instances might not have initialised tags yet - don't merge state when that happens
      if (instance.Name !== undefined) {
        return getInstanceState(accountName, environmentName, instance.Name, instance.InstanceId, instance.Role, instance.LaunchTime);
      } else {
        logger.warn(`Instance ${instance.InstanceId} name tag is undefined`);
        return {};
      }
    });

    _.forEach(instances, (instance, index) => {
      // Copy ASG instance data
      let asgInstance = _.find(asg.Instances, { InstanceId: instance.InstanceId });
      instance.LifecycleState = asgInstance.LifecycleState;

      // Copy ASG state data
      _.assign(instance, instancesStates[index]);
    });

    let services = yield getServicesState(environmentName, asg.getRuntimeServerRoleName(), instances);

    let response = getServicesSummary(services);
    _.assign(response, {
      Services: services,
      Instances: instances
    });

    return response;
  });
}

getASGState.getServicesSummary = getServicesSummary;

module.exports = getASGState;


/***/ }),
/* 136 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let serviceDiscovery = __webpack_require__(64);
let serviceTargets = __webpack_require__(26);
let _ = __webpack_require__(1);
let co = __webpack_require__(0);
let Enums = __webpack_require__(11);
let DIFF_STATE = Enums.DIFF_STATE;
let DEPLOYMENT_STATUS = Enums.DEPLOYMENT_STATUS;
let serviceUtil = __webpack_require__(332);

/**
 * Returns a detailed view of the current state of a given instance and its services
 */
function getInstanceState(accountName, environmentName, nodeName, instanceId, runtimeServerRoleName, instanceLaunchTime) {
  return co(function* () {
    // Get info on 'current state' of services from consul
    let response = yield {
      checks: serviceDiscovery.getNodeHealth(environmentName, nodeName),
      node: serviceDiscovery.getNode(environmentName, nodeName)
    };
    let checks = response.checks;
    let node = response.node;
    let services = node ? node.Services : [];

    // Get info on 'target state'
    let targetServiceStates = yield serviceTargets.getAllServiceTargets(environmentName, runtimeServerRoleName);

    // Combine consul service info with target state info and remove redundant service values
    let consulServiceContext = { checks, targetServiceStates, environmentName, instanceId, accountName };
    services = yield _.map(services, co.wrap(describeConsulService.bind(this, consulServiceContext)));
    services = _.compact(services);

    // Find missing services (in target state but not on instance)
    _.each(targetServiceStates, findMissingServices.bind(this, { services, accountName, instanceId, instanceLaunchTime }));
    // Find unexpected services (on instance but not in target state)
    _.each(services, findUnexpectedServices.bind(this, { targetServiceStates, runtimeServerRoleName }));
    // Set convenience name value
    _.each(services, (service) => { service.NameAndSlice = serviceUtil.getServiceAndSlice(service); });

    return {
      OverallHealth: serviceUtil.getOverallHealth(checks),
      DeploymentStatus: serviceUtil.getInstanceDeploymentStatus(services),
      RunningServicesCount: serviceUtil.getRunningServicesCount(services),
      MissingOrUnexpectedServices: serviceUtil.hasMissingOrUnexpectedServices(services),
      Services: services
    };
  });
}

/**
 * Augments a service object retrieved from consul with extra information
 *
 * @param context {object} Context info on healthchecks, target states, environment, instance & account
 * @param service {object} The service value from consul
 * @returns {object} A new object combining context info with consul service info
 */
function* describeConsulService(context, service) {
  let { checks, targetServiceStates, environmentName, instanceId, accountName } = context;
  service.Tags = serviceUtil.mapConsulTags(service.Tags);

  let targetService = _.find(targetServiceStates, {
    Name: serviceUtil.getSimpleServiceName(service.Service), Slice: service.Tags.slice });

  let deploymentId = _.get(targetService, 'DeploymentId') || service.Tags.deployment_id;

  if (!deploymentId) return false; // It's not EM deployed service

  let instanceDeploymentInfo = yield serviceTargets.getInstanceServiceDeploymentInfo(environmentName, deploymentId, instanceId);
  let deploymentStatus = instanceDeploymentInfo ? instanceDeploymentInfo.Status : 'Success';
  let logURL = serviceUtil.getLogUrl(deploymentId, accountName, instanceId);
  let deploymentCause = yield serviceTargets.getServiceDeploymentCause(environmentName, deploymentId, instanceId);
  // Note: we use DeploymentId from targetService, because DeploymentId from catalog might be old - in case
  // last deployment was unsuccessful
  return serviceUtil.formatConsulService(service, checks, deploymentId, deploymentStatus, deploymentCause, logURL);
}

/**
 * Finds services defined in target state but not present on instance.
 * Missing services are added to the {context.services} array in place.
 *
 * @param context {object} Context info on instance services, account, instance id and launch time
 * @param targetService {object} The target service to look for on the instance
 */
function findMissingServices(context, targetService) {
  let { services, accountName, instanceId, instanceLaunchTime } = context;

  if (_.find(services, { Name: targetService.Name, Slice: targetService.Slice }) === undefined) {
    if (targetService.Action === Enums.ServiceAction.IGNORE) {
      return; // Don't include ignored services
    }
    // Allow 60 minutes 'missing' before concluding that service won't get installed on instance
    let deploymentStatus;
    let timeoutDateMs = new Date(instanceLaunchTime).getTime() + (60 * 60 * 1000);
    if (timeoutDateMs > new Date().getTime()) {
      deploymentStatus = DEPLOYMENT_STATUS.InProgress;
    } else {
      deploymentStatus = DEPLOYMENT_STATUS.Failed;
    }
    let logURL = serviceUtil.getLogUrl(targetService.DeploymentId, accountName, instanceId);
    let missingService = serviceUtil.formatMissingService(targetService, deploymentStatus, logURL);
    services.push(missingService);
  }
}

/**
 * Finds services present on an instance that aren't defined in the target state.
 * Adds a warning attribute to any unexpected services
 *
 * @param context {object} Context info on target states and server role
 * @param instanceService {object} The service to interrogate
 */
function findUnexpectedServices(context, instanceService) {
  let { targetServiceStates, runtimeServerRoleName } = context;
  // If DiffWithTargetState is present, it's a placeholder - it's not present on instance
  if (instanceService.DiffWithTargetState !== null) {
    return;
  }
  let targetState = _.find(targetServiceStates, { Name: instanceService.Name, Slice: instanceService.Slice });

  if (targetState === undefined) {
    instanceService.Issues.Warnings.push(
      `Service missing in target state for server role "${runtimeServerRoleName}"`);
    instanceService.DiffWithTargetState = DIFF_STATE.Unexpected;
  } else if (targetState.Action !== Enums.ServiceAction.INSTALL) {
    instanceService.Issues.Warnings.push(
      `Service for server role "${runtimeServerRoleName}" is marked for "${targetState.Action}" action`);
    instanceService.DiffWithTargetState = DIFF_STATE.Unexpected;
  }
}

module.exports = getInstanceState;


/***/ }),
/* 137 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let InvalidOperationError = __webpack_require__(62);
const STATES_AS_IN_SERVICE = ['InService', 'Pending', 'Pending:Wait', 'Pending:Proceed'];

function getFirstUnknownInstanceId(autoScalingGroup, instanceIds) {
  let autoScalingGroupInstanceIds = autoScalingGroup.Instances.map(
    instance => instance.InstanceId
  );

  let unknownInstanceIds = instanceIds.filter(id =>
      autoScalingGroupInstanceIds.indexOf(id) < 0
  );
  return unknownInstanceIds[0];
}

function predictSizeAfterEnteringInstancesToStandby(autoScalingGroup, instancesIds) {
  let unknownInstanceId = getFirstUnknownInstanceId(autoScalingGroup, instancesIds);
  if (unknownInstanceId) {
    return Promise.reject(new InvalidOperationError(
      `The instance "${unknownInstanceId}" is not part of "${autoScalingGroup.AutoScalingGroupName}" AutoScalingGroup.`
    ));
  }

  let instancesInService = 0;
  let instancesToStandby = 0;

  for (let i = 0; i < autoScalingGroup.Instances.length; i++) {
    let instance = autoScalingGroup.Instances[i];

    // Counting all instances that are or will be InService
    if (STATES_AS_IN_SERVICE.indexOf(instance.LifecycleState) >= 0) instancesInService++;

    // Exclude all instances not specified by the command
    if (instancesIds.indexOf(instance.InstanceId) < 0) continue; // eslint-disable-line no-continue

    if (instance.LifecycleState !== 'InService') {
      return Promise.reject(new InvalidOperationError(
        `The instance "${instance.InstanceId}" cannot be entered to standby as its LifecycleState is ${instance.LifecycleState}.`
      ));
    }
    instancesToStandby++;
  }

  return Promise.resolve(instancesInService - instancesToStandby);
}

function predictSizeAfterExitingInstancesFromStandby(autoScalingGroup, instancesIds) {
  let unknownInstanceId = getFirstUnknownInstanceId(autoScalingGroup, instancesIds);
  if (unknownInstanceId) {
    return Promise.reject(new InvalidOperationError(
      `The instance "${unknownInstanceId}" is not part of "${autoScalingGroup.AutoScalingGroupName}" AutoScalingGroup.`
    ));
  }

  let instancesInService = 0;
  let instancesToUnstandby = 0;

  for (let i = 0; i < autoScalingGroup.Instances.length; i++) {
    let instance = autoScalingGroup.Instances[i];

    // Counting all instances that are or will be InService
    if (STATES_AS_IN_SERVICE.indexOf(instance.LifecycleState) >= 0) instancesInService++;

    // Exclude all instances not specified by the command
    if (instancesIds.indexOf(instance.InstanceId) < 0) continue; // eslint-disable-line no-continue

    if (instance.LifecycleState !== 'Standby') {
      return Promise.reject(new InvalidOperationError(
        `The instance "${instance.InstanceId}" cannot be exited from standby as its LifecycleState is ${instance.LifecycleState}.`
      ));
    }

    instancesToUnstandby++;
  }

  return Promise.resolve(instancesInService + instancesToUnstandby);
}

module.exports = {
  predictSizeAfterEnteringInstancesToStandby,
  predictSizeAfterExitingInstancesFromStandby
};


/***/ }),
/* 138 */
/***/ (function(module, exports) {

module.exports = require("request");

/***/ }),
/* 139 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function create(status, value) {
  return response => response.format({
    'text/plain': () => response.status(status).send(value), // This is the default if no "Accept" header specified; see https://expressjs.com/en/api.html#res.format
    'application/json': () => response.status(status).json({ url: value })
  });
};


/***/ }),
/* 140 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let Promise = __webpack_require__(10);
let co = __webpack_require__(0);
let _ = __webpack_require__(1);
let ResourceNotFoundError = __webpack_require__(37);
let servicesDb = __webpack_require__(28);

function hostFilter(active) {
  if (active === true) {
    return host => host.State === 'up';
  } else if (active === false) {
    return host => host.State === 'down';
  } else {
    return () => true;
  }
}

function* handleQuery(query, inputUpstreams) {
  // Get all LoadBalancer upstreams from DynamoDB without apply any filter.
  // NOTE: If it ever becomes a DynamoDB map item then filtering this query
  //       would be great!

  // If any upstream was found the chain continues otherwise a
  // [ResourceNotFound] error is returned.
  if (!inputUpstreams.length) {
    throw new ResourceNotFoundError('No load balancer upstream has been found.');
  }

  // Flatting upstreams hosts in to a plain list
  // eslint-disable-next-line arrow-body-style
  let upstreamValues = (upstream) => {
    return upstream.Hosts.filter(hostFilter(query.active)).map(host => ({
      Key: upstream.Key,
      EnvironmentName: upstream.Environment,
      ServiceName: upstream.Service,
      UpstreamName: upstream.Upstream,
      DnsName: host.DnsName,
      Port: host.Port,
      OwningCluster: '',
      Name: 'Unknown',
      State: host.State === 'up' ? 'Active' : 'Inactive'
    }));
  };

  let upstreams = _(inputUpstreams).map(upstreamValues).compact().flatten().value();
  // Getting all services the upstreams refer to

  // Extracts all service names the found upstreams refer to
  let serviceNames = [...new Set(upstreams.map(upstream => upstream.ServiceName))];

  // Gets all services from DynamoDB table
  let services = yield Promise.map(serviceNames, ServiceName => servicesDb.get({ ServiceName }))
    .then(ss => ss.filter(s => s));

  // Assigning blue/green port reference to the found slices
  function getServicesPortMapping(sliceServices) {
    let result = {};
    sliceServices.forEach((service) => {
      let portsMapping = {};
      portsMapping.owningCluster = service.OwningCluster;
      if (service.Value.BluePort) portsMapping[service.Value.BluePort] = 'Blue';
      if (service.Value.GreenPort) portsMapping[service.Value.GreenPort] = 'Green';
      result[service.ServiceName] = portsMapping;
    });

    return result;
  }

  let servicesPortsMapping = getServicesPortMapping(services);

  upstreams.forEach((upstream) => {
    let servicePortsMapping = servicesPortsMapping[upstream.ServiceName];
    if (!servicePortsMapping) return;
    upstream.OwningCluster = servicePortsMapping.owningCluster;
    let portMapping = servicePortsMapping[upstream.Port];
    if (!portMapping) return;
    upstream.Name = portMapping;
  });

  return upstreams;
}

module.exports = {
  handleQuery: co.wrap(handleQuery)
};


/***/ }),
/* 141 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let Promise = __webpack_require__(10);

let ResourceNotFoundError = __webpack_require__(37);
let InconsistentSlicesStatusError = __webpack_require__(355);
let logger = __webpack_require__(2);
let servicesDb = __webpack_require__(28);
let loadBalancerUpstreams = __webpack_require__(38);

function ToggleUpstreamByServiceVerifier() {
  this.verifyUpstreams = (upstreams) => {
    return getServicePortMappings(upstreams[0].Service)
      .then(portMapping => Promise.map(upstreams, upstream => detectUpstreamInconsistency(upstream, portMapping)));
  };

  function detectUpstreamInconsistency(upstream, portMapping) {
    if (upstream.Hosts.length === 0) {
      return makeUpstreamError(upstream, 'cannot be toggled because it has no slice');
    }

    if (upstream.Hosts.length === 1) {
      return makeUpstreamError(upstream, 'cannot be toggled because it has only one slice');
    }

    if (upstream.Hosts.length > 2) {
      return makeUpstreamError(upstream, 'cannot be toggled because it has more than two slices');
    }

    let statuses = [...new Set(upstream.Hosts.map((host) => { return host.State === 'up' ? 'Active' : 'Inactive'; }))];
    if (statuses.length === 1) {
      return makeUpstreamError(upstream, `cannot be toggled because all its slices are "${statuses[0]}"`);
    }

    let slicesNames = upstream.Hosts.map(host => portMapping[host.Port]);
    if (slicesNames.indexOf('Blue') < 0) {
      return makeUpstreamError(upstream, 'cannot be toggled because there is no way to detect which slice is "blue"');
    }

    if (slicesNames.indexOf('Green') < 0) {
      return makeUpstreamError(upstream, 'cannot be toggled because there is no way to detect which slice is "green"');
    }

    return Promise.resolve();
  }

  function makeUpstreamError(upstream, reason) {
    let message = `Upstream named "${upstream.Upstream}" which refers to "${upstream.Service}" service in "${upstream.Environment}" environment ${reason}.`;
    return Promise.reject(new InconsistentSlicesStatusError(message));
  }
}

function getServicePortMappings(serviceName) {
  return servicesDb.get({ ServiceName: serviceName })
    .then(asPortMapping);
}

function asPortMapping(service) {
  let portMapping = {};
  if (service) {
    if (service.Value.BluePort) portMapping[service.Value.BluePort] = 'Blue';
    if (service.Value.GreenPort) portMapping[service.Value.GreenPort] = 'Green';
  }

  return portMapping;
}

function ToggleUpstreamByNameVerifier(resourceName) {
  return {
    verifyUpstreams(upstreams) {
      if (upstreams.length > 1) {
        let keys = upstreams.map(upstream => upstream.key).join(', ');
        let message = `${resourceName} cannot be toggled because all following keys refer to it: ${keys}.`;
        return Promise.reject(new InconsistentSlicesStatusError(message));
      }

      let upstream = upstreams[0];
      if (upstream.Hosts.length === 0) {
        let message = `Upstream named "${upstream.Upstream}" which refers to "${upstream.Service}" service in "${upstream.Environment}" environment cannot be toggled because it has no slice.`;
        return Promise.reject(new InconsistentSlicesStatusError(message));
      }

      return Promise.resolve();
    }
  };
}

function UpstreamProvider(_, toggleCommand, resourceName) {
  let { environmentName, serviceName, upstreamName } = toggleCommand;

  let errorIfNone = items => (items.length === 0
    ? Promise.reject(new ResourceNotFoundError(`No ${resourceName} has been found.`))
    : Promise.resolve(items));

  return {
    provideUpstreams() {
      if (serviceName) {
        return loadBalancerUpstreams.inEnvironmentWithService(environmentName, serviceName)
          .then(errorIfNone);
      } else if (upstreamName) {
        return loadBalancerUpstreams.inEnvironmentWithUpstream(environmentName, upstreamName)
          .then(errorIfNone);
      } else {
        return Promise.reject(`Expected one of serviceName, upstreamName in toggleCommand: ${toggleCommand}`);
      }
    }
  };
}

function UpstreamToggler(senderInstance, toggleCommand) {
  let metadata = {
    TransactionID: toggleCommand.commandId,
    User: toggleCommand.username
  };
  return {
    toggleUpstream(upstream) {
      return getServicePortMappings(upstream.Service)
        .then(portMappings => loadBalancerUpstreams.toggle(upstream, metadata, toggleCommand, portMappings));
    }
  };
}

function orchestrate(provider, verifier, toggler) {
  let upstreamsP = provider.provideUpstreams();
  let verifiedP = upstreamsP.then(upstreams => verifier.verifyUpstreams(upstreams));
  let toggledP = Promise.map(upstreamsP, upstream => toggler.toggleUpstream(upstream)
    .then(() => [null, upstream.Upstream])
    .catch(error => [error, upstream.Upstream]));
  return Promise.join(toggledP, verifiedP, toggled => ({
    ToggledUpstreams: toggled.reduce((acc, [error, data]) => {
      if (error) {
        logger.error(error);
        return acc;
      } else {
        return [...acc, data];
      }
    }, [])
  }));
}

module.exports = {
  UpstreamProvider,
  UpstreamToggler,
  orchestrate,
  ToggleUpstreamByServiceVerifier,
  ToggleUpstreamByNameVerifier
};


/***/ }),
/* 142 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let { ServiceAction: { INSTALL } } = __webpack_require__(11);
let { format } = __webpack_require__(143);
let fp = __webpack_require__(4);

function createServerRoleFilter({ serviceName, slice, serverRole }) {
  if (!serviceName) {
    return () => true;
  }

  let slicePredicate = slice ? x => x === slice : () => true;
  let servicePredicate = ({ Action, Name, Slice }) =>
    (Name === serviceName)
    && slicePredicate(Slice)
    && (Action === undefined || Action === INSTALL);
  let serverRoleNamePredicate = serverRole
    ? x => new RegExp(`^${serverRole}((-blue)|(-green))?$`).test(x)
    : () => true;

  return ({ Role, Services }) => serverRoleNamePredicate(Role) && fp.some(servicePredicate)(Services);
}

function describeServerRoleFilter({ environmentName, serviceName, slice, serverRole }) {
  let print = fn => val => (val ? fn(val) : undefined);
  let sliceOf = print(x => `${x} slice of`);
  let service = print(x => `service ${x}`);
  let inEnvironment = print(x => `in environment ${x}`);
  let installedOn = print(x => `installed on server role ${x}`);
  return ['the', sliceOf(slice), service(serviceName), inEnvironment(environmentName), installedOn(serverRole)]
    .filter(x => x)
    .join(' ');
}

function fullyQualifiedServiceNamesFor({ environmentName, serviceName, slice }) {
  let slices = slice ? [slice] : ['blue', 'green', 'none'];
  return fp.map(format.bind(null, environmentName, serviceName))(slices);
}

module.exports = {
  createServerRoleFilter,
  describeServerRoleFilter,
  fullyQualifiedServiceNamesFor
};


/***/ }),
/* 143 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function format(environment, service, slice) {
  function validate(required, regexp, name, value) {
    if (!required && (value === null || value === undefined)) {
      return;
    }
    if (!(typeof value === 'string' && regexp.test(value))) {
      throw new Error(`${required ? 'Required' : 'Optional'} argument "${name}" must be a string matching ${regexp}`);
    }
  }

  let validateOptional = validate.bind(null, false);
  let validateRequired = validate.bind(null, true);
  validateRequired(/^[^-]+$/, 'environment', environment);
  validateRequired(/^[^-]+$/, 'service', service);
  validateOptional(/^[^-]+$/, 'slice', slice);
  let formatSlice = s => (s !== undefined && s !== null && s !== 'none' ? `-${slice}` : '');
  return `${environment}-${service}${formatSlice(slice)}`;
}

module.exports = {
  format
};


/***/ }),
/* 144 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



if (process.env.NEW_RELIC_APP_NAME !== undefined) {
  // eslint-disable-next-line global-require
  __webpack_require__(87); // This line must be executed before any other call to require()
}

global.Promise = __webpack_require__(10);
let AWS = __webpack_require__(29);
let co = __webpack_require__(0);
const fp = __webpack_require__(4);
let config = __webpack_require__(5);
let logger = __webpack_require__(2);

// TODO conver to singleton
let ConfigurationProvider = __webpack_require__(150);
let checkAppPrerequisites = __webpack_require__(154);
let cacheManager = __webpack_require__(34);
const miniStack = __webpack_require__(93);
const mini = miniStack.build();

process.on('unhandledRejection', (err) => {
  let entry;
  if (err instanceof Error) {
    entry = {
      error: {
        message: fp.get(['message'])(err),
        stack: fp.compose(fp.truncate({ length: 1400 }), mini, fp.get(['stack']))(err)
      },
      eventtype: 'UnhandledRejection'
    };
  } else {
    entry = err;
  }

  logger.warn('Promise rejection was unhandled: ', entry);
});

let servers;

function start() {
  co(function* () { // eslint-disable-line func-names
    AWS.config.setPromisesDependency(Promise);
    AWS.config.update({ region: config.get('EM_AWS_REGION') });
    let configurationProvider = new ConfigurationProvider();
    yield configurationProvider.init();
    yield cacheManager.flush();

    yield checkAppPrerequisites();
    config.logBootstrapValues();

    // eslint-disable-next-line global-require
    let mainServer = __webpack_require__(161);
    yield mainServer.start();
  }).catch((error) => {
    if (error !== undefined && error.stack !== undefined) {
      // eslint-disable-next-line no-console
      console.error(error.stack);
    }
  });
}

function stop() {
  servers.forEach(server => server.stop());
}

if (__webpack_require__.c[__webpack_require__.s] === module) {
  start();
}

module.exports = {
  start,
  stop
};

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(145)(module)))

/***/ }),
/* 145 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 146 */
/***/ (function(module, exports) {

module.exports = require("nconf");

/***/ }),
/* 147 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const VERSION_INFO = 'version.txt';

let fs = __webpack_require__(27);
let packageInfo = __webpack_require__(148);

function getVersion() {
  if (fs.existsSync(VERSION_INFO)) {
    return fs.readFileSync(VERSION_INFO, 'utf-8').trim();
  } else {
    return `${packageInfo.version}-DEV`;
  }
}

module.exports = {
  getVersion
};


/***/ }),
/* 148 */
/***/ (function(module, exports) {

module.exports = {"name":"environmentmanager","version":"6.12.2","description":"EnvironmentManager Server","homepage":"https://trainline.github.io/environment-manager/","bugs":{"url":"https://github.com/trainline/environment-manager/issues","email":"platform.development@thetrainline.com"},"config":{"git-tag-version":false},"repository":{"type":"git","url":"https://github.com/trainline/environment-manager.git"},"main":"index.js","scripts":{"build":"webpack","start":"node lib/server.js","dev":"webpack --watch --progress --colors --config webpack.config.dev.js","lint":"eslint src --ext .js --quiet && tslint --project tsconfig.json src/**/*.ts","test":"mocha-webpack --require src/test/bootstrap.js --webpack-config webpack.config.test.js --recursive \"src/test/**/*.js\"","test:watch":"mocha-webpack --watch --require src/test/bootstrap.js --webpack-config webpack.config.test.js --recursive \"src/test/**/*.js\""},"author":{"name":"Platform Development","email":"platform.development@thetrainline.com"},"license":"Apache-2.0","dependencies":{"activedirectory":"~0.7.2","ajv":"~4.10.0","async":"~2.1.4","aws-sdk":"~2.151.0","bluebird":"~3.4.6","body-parser":"~1.15.2","cache-manager":"~2.4.0","co":"~4.6.0","compression":"~1.6.2","consul":"~0.27.0","cookie-parser":"~1.4.3","deep-freeze-strict":"^1.1.1","es6-template-strings":"~2.0.1","express":"~4.14.0","express-request-id":"~1.3.0","glob-intersection":"~0.1.3","ioredis":"~2.5.0","js-joda":"~1.1.17","js-yaml":"~3.7.0","jsonwebtoken":"~7.1.9","later":"~1.2.0","lodash":"~4.17.2","md5":"^2.2.1","moment":"~2.17.1","moment-timezone":"~0.5.11","ms":"~0.7.2","nconf":"~0.8.4","newrelic":"~1.36.2","request":"~2.79.0","retry":"~0.10.0","semver":"~5.3.0","source-map-support":"^0.5.0","swagger-tools":"~0.10.1","uuid":"^3.1.0","winston":"~2.3.0"},"devDependencies":{"@types/core-js":"^0.9.43","@types/node":"^8.0.51","@types/uuid":"^3.4.3","chai":"^3.5.0","eslint":"^3.11.1","eslint-config-airbnb-base":"^10.0.1","eslint-import-resolver-typescript":"^1.0.2","eslint-import-resolver-webpack":"^0.8.3","eslint-plugin-dependencies":"^2.4.0","eslint-plugin-import":"^2.2.0","inject-loader":"^3.0.1","mocha":"^3.2.0","mocha-duplicate-reporter":"^0.2.1","mocha-teamcity-reporter":"^1.1.1","mocha-webpack":"^1.0.1","mock-express-request":"^0.2.0","mock-express-response":"^0.2.0","should":"^11.1.1","sinon":"^1.17.6","supertest":"^2.0.1","ts-loader":"^3.1.1","ts-node":"^3.3.0","tslint":"^5.8.0","typescript":"^2.6.1","webpack":"^3.8.1","webpack-node-externals":"^1.6.0","webpack-shell-plugin":"^0.5.0"},"engines":{"node":">=6.7.0","npm":">=3.10.3"},"os":["darwin","linux","win32"],"jshintConfig":{"esversion":6,"globals":{"setInterval":true,"Buffer":true,"console":true,"process":true,"global":true,"__dirname":true,"require":true,"module":true,"describe":true,"before":true,"after":true,"it":true},"undef":true,"strict":"global"}}

/***/ }),
/* 149 */
/***/ (function(module, exports) {

module.exports = require("winston");

/***/ }),
/* 150 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let config = __webpack_require__(5);
let LocalConfigurationProvider = __webpack_require__(151);
let S3ConfigurationProvider = __webpack_require__(153);
let logger = __webpack_require__(2);


module.exports = function ConfigurationProvider() {
  this.init = function () {
    let configurationProvider = (() => {
      if (config.get('IS_PRODUCTION')) {
        return new S3ConfigurationProvider();
      } else {
        return new LocalConfigurationProvider();
      }
    })();

    function loadConfiguration() {
      return configurationProvider.get()
        .then(configuration => config.setUserValue('local', configuration), logger.error.bind(logger));
    }

    return loadConfiguration();
  };
};


/***/ }),
/* 151 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const console = __webpack_require__(152);
const fs = __webpack_require__(27);
const Promise = __webpack_require__(10);
const findInAncestor = __webpack_require__(46);

const readFile = Promise.promisify(fs.readFile);
const configFileNotFoundMessage = `Please create configuration.json to start the app in development mode.
You can find sample configuration file in configuration.sample.json`;

module.exports = function LocalConfigurationProvider() {
  this.get = () =>
    readFile(findInAncestor('configuration.json', __dirname))
      .then(text => JSON.parse(text))
      .catch((error) => {
        if (error.code === 'ENOENT') {
          console.log(configFileNotFoundMessage);
        }
        return Promise.reject(error);
      });
};


/***/ }),
/* 152 */
/***/ (function(module, exports) {

module.exports = require("console");

/***/ }),
/* 153 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let masterAccountClient = __webpack_require__(16);
let config = __webpack_require__(5);

const S3_BUCKET = config.get('EM_AWS_S3_BUCKET');
const S3_KEY = config.get('EM_AWS_S3_KEY');

module.exports = function S3ConfigurationProvider() {
  this.get = function getConfigurationFromS3() {
    let parameters = {
      Bucket: S3_BUCKET,
      Key: S3_KEY
    };

    return masterAccountClient
      .createS3Client()
      .then(client => client.getObject(parameters).promise())
      .then(object => JSON.parse(object.Body.toString('utf8')));
  };
};


/***/ }),
/* 154 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let co = __webpack_require__(0);
let permissionsDb = __webpack_require__(66);
let logger = __webpack_require__(2);
let guid = __webpack_require__(41);
let config = __webpack_require__(5);

function checkAppPrerequisites() {
  return co(function* () {
    logger.info('Checking app prerequisites..');

    let permissionsExist = yield checkIfPermissionsExist();

    if (!permissionsExist) {
      yield insertDefaultAdminPermission();
    }

    logger.info('App prerequisites satisfied.');
  });
}

function checkIfPermissionsExist() {
  return co(function* () {
    let results = yield permissionsDb.scan({ Limit: 1 });
    return !!(results && results.length);
  });
}

function insertDefaultAdminPermission() {
  return co(function* () {
    logger.info('Inserting default admin permission.');
    let localConfig = config.getUserValue('local');
    let defaultAdmin = localConfig.authentication.defaultAdmin;

    if (!defaultAdmin) {
      throw new Error('The value "authentication.defaultAdmin" was not found in config. This is required to create the first permission.');
    }

    yield permissionsDb.create({
      record: {
        Name: defaultAdmin,
        Permissions: [{ Resource: '**', Access: 'ADMIN' }]
      },
      metadata: {
        TransactionID: guid(),
        User: 'system'
      }
    });
  });
}

// eslint-disable-next-line arrow-body-style
module.exports = () => {
  return co(function* () {
    return checkAppPrerequisites();
  });
};


/***/ }),
/* 155 */
/***/ (function(module, exports) {

module.exports = require("deep-freeze-strict");

/***/ }),
/* 156 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let { updateAuditMetadata } = __webpack_require__(17);
let { compareAndSetVersionOnUpdate, setVersionOnUpdate } = __webpack_require__(15);
let { flow } = __webpack_require__(4);

function softDelete({ key, metadata, expectedVersion }) {
  let updateExpression = ['update', ['set', ['at', '__Deleted'], ['val', true]]];
  let updateWithDeleteMarker = expectedVersion
    ? flow(
      updateAuditMetadata,
      UpdateExpression => ({
        key,
        expressions: { UpdateExpression },
        expectedVersion
      }),
      compareAndSetVersionOnUpdate
    )
    : flow(
      updateAuditMetadata,
      UpdateExpression => ({
        key,
        expressions: { UpdateExpression }
      }),
      setVersionOnUpdate
    );
  return updateWithDeleteMarker({ key, metadata, updateExpression });
}

module.exports = {
  softDelete
};


/***/ }),
/* 157 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let dynamoTable = __webpack_require__(48);
let cacheManager = __webpack_require__(34);
let logger = __webpack_require__(2);

function logError(message, tableName) {
  return (error) => {
    logger.error(`${message}. table=${tableName}`);
    logger.error(error);
  };
}

function dynamoTableCache(logicalTableName, { ttl }) {
  let cache = cacheManager.create(logicalTableName, dynamoTable.scan, { stdTTL: ttl });

  function create(tableName, createSpec) {
    return dynamoTable.create(tableName, createSpec)
      .then(() => cache.del(tableName).catch(logError('Could not invalidate cache', tableName)));
  }

  function $delete(tableName, deleteSpec) {
    return dynamoTable.delete(tableName, deleteSpec)
      .then(() => cache.del(tableName).catch(logError('Could not invalidate cache', tableName)));
  }

  function get(tableName, key) {
    return dynamoTable.get(tableName, key);
  }

  function query(tableName, expressions) {
    return dynamoTable.query(tableName, expressions);
  }

  function replace(tableName, replaceSpec) {
    return dynamoTable.replace(tableName, replaceSpec)
      .then(() => cache.del(tableName).catch(logError('Could not invalidate cache', tableName)));
  }

  function scan(tableName, filter) {
    if (filter) {
      return dynamoTable.scan(tableName, filter);
    } else {
      return cache.get(tableName).catch((error) => {
        logError('Could not get from cache', tableName)(error);
        return dynamoTable.scan(tableName);
      });
    }
  }

  function update(tableName, updateSpec) {
    return dynamoTable.update(tableName, updateSpec)
      .then(() => cache.del(tableName).catch(logError('Could not invalidate cache', tableName)));
  }

  return {
    create,
    delete: $delete,
    get,
    query,
    replace,
    scan,
    update
  };
}

module.exports = dynamoTableCache;


/***/ }),
/* 158 */
/***/ (function(module, exports) {

module.exports = require("cache-manager");

/***/ }),
/* 159 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let fp = __webpack_require__(4);
let logger = __webpack_require__(2);
let memoize = __webpack_require__(88);
let Redis = __webpack_require__(90);
let timers = __webpack_require__(91);

const NOT_FOUND = undefined;

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function timeout(t) {
  return delay(t).then(() => Promise.reject(new Error(`operation timed out after ${t} milliseconds`)));
}

function logError(error) {
  logger.error(error);
  return NOT_FOUND;
}

function circuitBreaker(policy) {
  let state = 'CLOSED';
  let failures = 0;
  function open() {
    state = 'OPEN';
    timers.setTimeout(() => { state = 'HALF OPEN'; }, policy.resetperiod);
  }
  function close() {
    state = 'CLOSED';
  }
  return (fn) => {
    if (state === 'OPEN') {
      return Promise.reject(new Error('Circuit Breaker open.'));
    } else if (state === 'HALF OPEN') {
      return Promise.resolve(fn()).then((x) => { close(); return x; }, (e) => { open(); return Promise.reject(e); });
    } else {
      return Promise.resolve(fn()).catch((e) => {
        failures += 1;
        timers.setTimeout(() => { failures -= 1; }, policy.failurettl);
        if (failures > policy.maxfailures) {
          open();
        }
        return Promise.reject(e);
      });
    }
  };
}

function connectToRedis({ address, port }) {
  let client = new Redis({
    host: address,
    port,
    lazyConnect: true,
    connectTimeout: 1000,
    reconnectOnError: () => {
      return 2;
    }
  });
  let events = ['close', 'connect', 'end', 'error', 'ready', 'reconnecting'];
  events.forEach((name) => {
    client.on(name, (e) => {
      logger.debug(`${name}: redis ${address}:${port}`);
      if (e) {
        logger.debug(e);
      }
    });
  });
  client.on('error', e => logger.error(e));
  return client;
}

function encryptedRedisStore(args) {
  const WRITE_TIMEOUT = args.writeTimeout || 1000;
  const READ_TIMEOUT = args.readTimeout || 1000;

  let redis = connectToRedis({ address: args.host, port: args.port });
  let breaker = circuitBreaker({ failurettl: 1000, maxfailures: 2, resetperiod: 1000 });
  let id = x => x;
  let keyToStore = fp.get(['keyTransform', 'toStore'])(args) || id;
  let valueToStore = fp.get(['valueTransform', 'toStore'])(args) || fp.flow(JSON.stringify, str => new Buffer(str));
  let valueFromStore = fp.get(['valueTransform', 'fromStore'])(args) || fp.flow(buf => buf.toString(), JSON.parse);

  function del(key, options, callback) {
    let cb = (typeof options === 'function') ? options : callback;

    let skey = keyToStore(key);
    let promise = breaker(() => Promise.race([timeout(WRITE_TIMEOUT), redis.del(skey)]))
      .catch((error) => {
        logger.error(`Redis operation failed: DEL key=${key}`);
        return logError(error);
      });

    if (cb) {
      return promise.then(cb.bind(null, null), cb.bind(null));
    } else {
      return promise;
    }
  }

  function get(key, options, callback) {
    let cb = (typeof options === 'function') ? options : callback;

    let skey = keyToStore(key);

    let promise = breaker(() => Promise.race([timeout(READ_TIMEOUT), redis.getBuffer(skey)]))
      .then(value => (value ? valueFromStore(value) : NOT_FOUND), logError)
      .catch((error) => {
        logger.error(`Redis operation failed: GET key=${key}`);
        return logError(error);
      });

    if (cb) {
      return promise.then(cb.bind(null, null), cb.bind(null));
    } else {
      return promise;
    }
  }

  function keys(cb) {
    let error = new Error('Encrypted Redis store does not support the "keys" operation');
    if (cb) {
      return cb(error);
    } else {
      return Promise.reject(error);
    }
  }

  function reset(cb) {
    let promise = breaker(() => Promise.race([timeout(WRITE_TIMEOUT), redis.flushdb()]))
      .catch((error) => {
        logger.error('Redis operation failed: FLUSHDB');
        return logError(error);
      });

    if (cb) {
      return promise.then(cb.bind(null, null), cb.bind(null));
    } else {
      return promise;
    }
  }

  function set(key, value, options, callback) {
    let cb = (typeof options === 'function') ? options : callback;
    let opts = (typeof options === 'function') ? {} : (options || {});

    let skey = keyToStore(key);
    let svalue = valueToStore(value);
    let redisOperation = (() => {
      let ttl = fp.get('ttl')(opts) || args.ttl;
      if (ttl) {
        return () => redis.setexBuffer(skey, ttl, svalue);
      } else {
        return () => redis.setBuffer(skey, svalue);
      }
    })();

    let promise = breaker(() => Promise.race([timeout(WRITE_TIMEOUT), redisOperation()]))
      .catch((error) => {
        logger.error(`Redis operation failed: SET key=${key}`);
        return logError(error);
      });

    if (cb) {
      return promise.then(cb.bind(null, null), cb.bind(null));
    } else {
      return promise;
    }
  }

  return {
    del,
    get,
    keys,
    reset,
    set
  };
}

module.exports = {
  create: memoize(encryptedRedisStore)
};


/***/ }),
/* 160 */
/***/ (function(module, exports) {

module.exports = require("crypto");

/***/ }),
/* 161 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let path = __webpack_require__(40);
let express = __webpack_require__(70);
let bodyParser = __webpack_require__(162);
let cookieParser = __webpack_require__(163);
let logger = __webpack_require__(2);
let config = __webpack_require__(5);
let compression = __webpack_require__(164);
let expressRequestId = __webpack_require__(165);
let ServerFactoryConfiguration = __webpack_require__(166);
let serverFactoryConfiguration = new ServerFactoryConfiguration();
let tokenAuthentication = __webpack_require__(167);
let cookieAuthentication = __webpack_require__(98);
let authentication = __webpack_require__(184);
let deploymentMonitorScheduler = __webpack_require__(185);
let apiV1 = __webpack_require__(204);
let initialData = __webpack_require__(368);
let httpServerFactory = __webpack_require__(370);
let loggingMiddleware = __webpack_require__(373);
let deprecateMiddleware = __webpack_require__(374);
let cacheRouter = __webpack_require__(375);

const APP_VERSION = __webpack_require__(5).get('APP_VERSION');

let serverInstance;

function createExpressApp() {
  /* eslint-disable global-require */
  let httpHealthChecks = __webpack_require__(377);
  let routes = {
    home: __webpack_require__(381),
    deploymentNodeLogs: __webpack_require__(385)
  };
  /* eslint-enable */

  let app = express();
  /* enable the 'trust proxy' setting so that we resolve
   * the client IP address when app is behind HTTP Proxy
   * http://expressjs.com/en/guide/behind-proxies.html
   * */
  app.enable('trust proxy');

  let loggerMiddleware = loggingMiddleware.loggerMiddleware(logger);
  let errorLoggerMiddleware = loggingMiddleware.errorLoggerMiddleware(logger);

  return apiV1().then(({
    swaggerAuthorizer,
    swaggerBasePath,
    swaggerErrorHandler,
    swaggerMetadata,
    swaggerRouter,
    swaggerUi,
    swaggerValidator,
    swaggerNewRelic
  }) => {
    app.use(expressRequestId());
    app.use(compression());
    app.use(cookieParser());
    app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
    app.use(bodyParser.json({ extended: false, limit: '50mb' }));

    // Deprecate routes that are part of the pre-v1 API.
    app.use('/api', deprecateMiddleware(req => (req.originalUrl.startsWith(swaggerBasePath)
      ? undefined
      : `this operation will be removed after ${new Date(2017, 2, 17).toUTCString()}`)));

    /* notice how the router goes after the logger.
     * https://www.npmjs.com/package/express-winston#request-logging */
    app.use(loggerMiddleware);

    const PUBLIC_DIR = config.get('PUBLIC_DIR');
    logger.info(`Serving static files from "${PUBLIC_DIR}"`);
    logger.info(`Serving js files from "${__dirname}"`);

    let staticPaths = ['*.js', '*.css', '*.html', '*.ico', '*.gif',
      '*.woff2', '*.ttf', '*.woff', '*.svg', '*.eot', '*.jpg', '*.png', '*.map'];

    app.get(staticPaths, authentication.allowUnknown, express.static(PUBLIC_DIR));
    app.get('/', express.static(PUBLIC_DIR));

    app.get('*.js', authentication.allowUnknown, express.static(path.resolve(__dirname, '../shared'))); /* HACK ALERT */

    app.use('/schema', authentication.allowUnknown, express.static(`${PUBLIC_DIR}/schema`));

    app.use('/diagnostics/healthchecks', httpHealthChecks.router);
    app.use('/flushcache', cacheRouter.router);

    app.use(cookieAuthentication.middleware);
    app.use(tokenAuthentication.middleware);

    app.get('/deployments/nodes/logs', authentication.denyUnauthorized, routes.deploymentNodeLogs);

    app.get('/em/initial-data', initialData);

    app.use(swaggerMetadata);
    app.use(swaggerValidator);
    app.use(swaggerBasePath, [swaggerNewRelic, swaggerAuthorizer]);
    app.use(swaggerRouter);
    app.use(swaggerUi);
    app.use(errorLoggerMiddleware);
    app.use(swaggerErrorHandler);

    return Promise.resolve(app);
  });
}

function createServer(app) {
  let parameters = {
    port: serverFactoryConfiguration.getPort()
  };

  return httpServerFactory.create(app, parameters).then((server) => {
    logger.info(`Main server created using ${httpServerFactory.constructor.name} service.`);
    logger.info(`Main server listening at port ${parameters.port}.`);
    return server;
  });
}

function initializeServer(server) {
  serverInstance = server;
  deploymentMonitorScheduler.start();
  logger.info(`EnvironmentManager v.${APP_VERSION} started!`);
}

module.exports = {
  start: () => {
    return createExpressApp()
      .then(createServer)
      .then(initializeServer);
  },
  stop: () => {
    serverInstance.close();
  }
};


/***/ }),
/* 162 */
/***/ (function(module, exports) {

module.exports = require("body-parser");

/***/ }),
/* 163 */
/***/ (function(module, exports) {

module.exports = require("cookie-parser");

/***/ }),
/* 164 */
/***/ (function(module, exports) {

module.exports = require("compression");

/***/ }),
/* 165 */
/***/ (function(module, exports) {

module.exports = require("express-request-id");

/***/ }),
/* 166 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let config = __webpack_require__(5);

module.exports = function ServerFactoryConfiguration() {
  this.getPort = () => configuration.port;

  let loadConfiguration = function () {
    let configuration = config.getUserValue('local');

    assert(configuration.server, 'missing \'server\' field in configuration');
    assert(configuration.server.port, 'missing \'server.port\' field in configuration');
    return {
      port: configuration.server.port
    };
  };

  let configuration = loadConfiguration();
};


/***/ }),
/* 167 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let userService = __webpack_require__(50);

const PATTERN = /bearer\s+(.*)/i;

module.exports = {
  middleware(req, res, next) {
    if (req.user) return next();

    let authorization = req.headers.authorization;
    if (!authorization) return next();

    let match = PATTERN.exec(authorization);
    if (!match) return next();

    return userService.getUserByToken(match[1])
      .then((user) => {
        req.user = user;
        req.authenticatedBy = 'bearer';
        return next();
      }, (error) => {
        res.status(401);
        res.send(error.message);
      });
  }
};


/***/ }),
/* 168 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let ms = __webpack_require__(42);
let User = __webpack_require__(71);
let utils = __webpack_require__(51);
let ActiveDirectoryError = __webpack_require__(94);

function authenticateUser(credentials, duration) {
  if (!credentials.username) {
    return Promise.reject(new Error('User must belong to "corp" domain.'));
  }
  let name = credentials.username.toLowerCase().replace('corp\\', '');
  let groups = [];
  let permissions = [{ Access: 'ADMIN', Resource: '**' }];
  let expiration = getExpiration(duration);
  let user = User.new(name, expiration, groups, permissions);
  let userJson = JSON.stringify(user.toJson());
  return Promise.resolve(new Buffer(userJson).toString('base64'));
}

function getUserByToken(token) {
  let userJson = new Buffer(token, 'base64').toString('utf8');
  let data = utils.safeParseJSON(userJson);
  if (!data) return Promise.reject(new ActiveDirectoryError('Wrong cookie'));
  return Promise.resolve(User.new(data.name, data.expiration, data.groups, data.permissions));
}

function signOut() {
  return Promise.resolve();
}

function getExpiration(duration) {
  let durationMs = ms(duration);
  let dateNow = new Date();
  let dateEnd = new Date(dateNow.setMilliseconds(dateNow.getMilliseconds() + durationMs));
  return dateEnd.getTime();
}

module.exports = {
  authenticateUser,
  getUserByToken,
  signOut
};


/***/ }),
/* 169 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let ms = __webpack_require__(42);
let jsonwebtoken = __webpack_require__(170);
let guid = __webpack_require__(41);
let co = __webpack_require__(0);
let User = __webpack_require__(71);
let UserRolesProvider = __webpack_require__(171);
let activeDirectoryAdapter = __webpack_require__(172);
let logger = __webpack_require__(2);
let md5 = __webpack_require__(178);
let UserSessionStore = __webpack_require__(95);
let Promise = __webpack_require__(10);
let SslComponentsRepository = __webpack_require__(96);

let userRolesProvider = new UserRolesProvider();

module.exports = function UserService() {
  let sslComponentsRepository = new SslComponentsRepository();

  this.authenticateUser = authenticateUser;
  this.getUserByToken = getUserByToken;
  this.signOut = signOut;

  function authenticateUser(credentials, duration) {
    return co(function* () {
      let scope = credentials.scope || 'api';
      let durationInMillis = ms(duration);
      let expiration = getExpiration(durationInMillis);
      let userSession = yield authenticate(credentials, expiration, scope);

      let session = {
        sessionId: userSession.sessionId,
        user: userSession.user.toJson(),
        password: md5(credentials.password)
      };

      yield storeSession(session, scope, durationInMillis);
      return yield createSessionToken(session, duration);
    }).catch((err) => {
      logger.error(err);
      throw err;
    });
  }

  function authenticate(credentials, expiration, scope) {
    return co(function* () {
      let session = yield getExistingSessionForUser(credentials, scope);

      if (session) {
        if (session.password === md5(credentials.password)) {
          return {
            sessionId: session.sessionId,
            user: User.parse(session.user)
          };
        }
      }

      let activeDirectoryUser = yield activeDirectoryAdapter.authorizeUser(credentials);

      let name = activeDirectoryUser.name;
      let groups = activeDirectoryUser.roles;
      let permissions = yield userRolesProvider.getPermissionsFor(_.union([name], groups));

      return {
        sessionId: guid(),
        user: User.new(name, expiration, groups, permissions)
      };
    });
  }

  function signOut(encryptedToken) {
    return co(function* () {
      let token = yield readToken(encryptedToken);
      return yield deleteSessionFromStore(token.sessionId);
    });
  }

  function getExistingSessionForUser(credentials, scope) {
    return co(function* () {
      let store = yield getStore();
      let userScopeSessionKey = getLatestSessionIdForUserAndScope(credentials.username, scope);
      let sessionId = yield store.get(userScopeSessionKey);
      if (sessionId) {
        return yield getSessionFromStore(sessionId);
      }
      return null;
    });
  }

  function createSessionToken(session, duration) {
    return co(function* () {
      let sslComponents = yield sslComponentsRepository.get();
      let options = {
        // TODO: Look into whether can upgrade this algorithm
        algorithm: 'RS256',
        expiresIn: duration
      };
      let token = { sessionId: session.sessionId };

      return createSignedWebToken(token, sslComponents.privateKey, options);
    });
  }

  function getUserByToken(encryptedToken) {
    return co(function* () {
      let token = yield readToken(encryptedToken);
      let session = yield getSessionFromStore(token.sessionId);
      return User.parse(session.user);
    });
  }

  function readToken(encryptedToken) {
    return co(function* () {
      let sslComponents = yield sslComponentsRepository.get();
      let options = {
        algorithm: 'RS256',
        ignoreExpiration: false
      };
      return verifyAndDecryptWebToken(encryptedToken, sslComponents.certificate, options);
    });
  }

  let createSignedWebToken = jsonwebtoken.sign;
  let verifyAndDecryptWebToken = Promise.promisify(jsonwebtoken.verify);

  function getExpiration(durationMs) {
    let dateNow = new Date();
    let dateEnd = new Date(dateNow.setMilliseconds(dateNow.getMilliseconds() + durationMs));
    return dateEnd.getTime();
  }

  function storeSession(session, scope, duration) {
    return co(function* () {
      let store = yield getStore();
      yield store.psetex(getSessionKey(session.sessionId), duration, session);
      yield store.psetex(getLatestSessionIdForUserAndScope(session.user.name, scope), duration, session.sessionId);
    });
  }

  function getSessionFromStore(sessionId) {
    return co(function* () {
      let sessionKey = getSessionKey(sessionId);
      let store = yield getStore();
      return yield store.get(sessionKey);
    });
  }

  function deleteSessionFromStore(sessionId) {
    return co(function* () {
      let sessionKey = getSessionKey(sessionId);
      let store = yield getStore();
      return yield store.del(sessionKey);
    });
  }

  function getStore() {
    return UserSessionStore.get();
  }

  function getSessionKey(sessionId) {
    return `session-${sessionId}`;
  }

  function getLatestSessionIdForUserAndScope(username, scope) {
    return `latest-${scope}-session-${md5(username)}`;
  }
};


/***/ }),
/* 170 */
/***/ (function(module, exports) {

module.exports = require("jsonwebtoken");

/***/ }),
/* 171 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let permissionsDb = __webpack_require__(66);

module.exports = function UserRolesProvider() {
  this.getPermissionsFor = (names) => {
    if (!names) {
      return Promise.resolve([]);
    }

    let tasks = names.map(getPermissions);

    return Promise.all(tasks).then((results) => {
      let users = _.flatten(results);
      let permissions = _.flatten(users.map(user => user.Permissions));

      return permissions;
    });
  };

  this.getFromActiveDirectoryGroupMembership = (groupMembership) => {
    let roles = [];

    if (groupMembership.indexOf('GG-APP-EnvironmentManager-ReadOnly') >= 0) {
      addIfMissing(roles, 'view');
    }

    if (groupMembership.indexOf('GG-APP-EnvironmentManager-Toggle') >= 0) {
      addIfMissing(roles, 'view');
      addIfMissing(roles, 'toggle');
    }

    if (groupMembership.indexOf('GG-APP-EnvironmentManager-Editor') >= 0) {
      addIfMissing(roles, 'view');
      addIfMissing(roles, 'toggle');
      addIfMissing(roles, 'edit');
    }

    if (groupMembership.indexOf('GG-APP-EnvironmentManager-Test') >= 0) {
      addIfMissing(roles, 'view');
      addIfMissing(roles, 'toggle');
      addIfMissing(roles, 'edit');
    }

    return roles;
  };

  let addIfMissing = function (roles, roleName) {
    if (roles.indexOf(roleName) >= 0) return;
    roles.push(roleName);
  };

  let getPermissions = function (name) {
    return permissionsDb.get({ Name: name })
      .then(result => (result === null ? [] : [result]));
  };
};


/***/ }),
/* 172 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let config = __webpack_require__(5);
const mock = __webpack_require__(173);
const prod = __webpack_require__(174);

let Implementation = config.get('IS_PRODUCTION') ? prod : mock;

module.exports = new Implementation();


/***/ }),
/* 173 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



module.exports = function ActiveDirectoryAdapter() {
  this.configure = () => { };

  this.authorizeUser = (credentials) => {
    let roles = [];

    switch (credentials.username) {
      case 'jbloggs':
        roles.push('GG-APP-EnvironmentManager-Test');
        break;

      case 'tuser':
        roles.push('GG-APP-EnvironmentManager-Test');
        roles.push('GG-APP-EnvironmentManager-Test2');
        break;

      default:
        roles.push('GG-APP-EnvironmentManager-Admin');
        break;
    }

    let name = credentials.username.toLowerCase();
    return Promise.resolve({ name, roles });
  };
};


/***/ }),
/* 174 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let Promise = __webpack_require__(10);
let ActiveDirectory = __webpack_require__(175);
let ActiveDirectoryError = __webpack_require__(94);
let InvalidCredentialsError = __webpack_require__(176);
let ActiveDirectoryAdapterConfiguration = __webpack_require__(177);

let activeDirectoryAdapterConfiguration = new ActiveDirectoryAdapterConfiguration();

module.exports = function ActiveDirectoryAdapter() {
  let configuration = activeDirectoryAdapterConfiguration.get();
  let adClient = Promise.promisifyAll(new ActiveDirectory(configuration));

  function standardizeError(error) {
    switch (error.name) {
      case 'InvalidCredentialsError':
        return new InvalidCredentialsError('Provided CORP username or password are invalid.');
      default:
        return new ActiveDirectoryError(error.message);
    }
  }

  // eslint-disable-next-line arrow-body-style
  this.authorizeUser = (credentials) => {
    return co(function* () {
      // Authenticate ActiveDirectory via its credentials
      yield adClient.authenticateAsync(credentials.username, credentials.password);

      // Get the user information
      let segments = credentials.username.split('\\');

      let username = segments.length < 2 ? segments[0] : segments[1];

      let groups = yield adClient.getGroupMembershipForUserAsync(username);

      let activeDirectoryUser = {
        name: username,
        roles: groups.map(group => group.cn)
      };

      return activeDirectoryUser;
    }).catch((error) => {
      throw standardizeError(error);
    });
  };
};


/***/ }),
/* 175 */
/***/ (function(module, exports) {

module.exports = require("activedirectory");

/***/ }),
/* 176 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function InvalidCredentialsError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 177 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let config = __webpack_require__(5);

module.exports = function ActiveDirectoryAdapterConfiguration() {
  let configuration;

  this.get = function getConfiguration() {
    if (!configuration) {
      configuration = config.getUserValue('local').ActiveDirectory;
    }

    return configuration;
  };
};


/***/ }),
/* 178 */
/***/ (function(module, exports) {

module.exports = require("md5");

/***/ }),
/* 179 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let logger = __webpack_require__(2);
let Redis = __webpack_require__(90);
let config = __webpack_require__(5);
let co = __webpack_require__(0);
let emCrypto = __webpack_require__(92);
let masterAccountClient = __webpack_require__(16);

const EM_REDIS_ADDRESS = config.get('EM_REDIS_ADDRESS');
const EM_REDIS_PORT = config.get('EM_REDIS_PORT');
const EM_REDIS_CRYPTO_KEY = config.get('EM_REDIS_CRYPTO_KEY');
const EM_REDIS_CRYPTO_KEY_S3_BUCKET = config.get('EM_REDIS_CRYPTO_KEY_S3_BUCKET');
const EM_REDIS_CRYPTO_KEY_S3_KEY = config.get('EM_REDIS_CRYPTO_KEY_S3_KEY');

function createStore(db) {
  return co(function* () {
    let client = connectToRedis(db);
    let cryptoKey = yield getCryptoKey();

    return createEncryptedRedisStore(client, cryptoKey);
  });
}

function createEncryptedRedisStore(client, cryptoKey) {
  let TIMEOUT = 5000;

  function status() {
    return client.status;
  }

  function get(key) {
    return withTimeout(client.getBuffer(key).then((value) => {
      if (value === null) return null;
      return decrypt(value);
    }));
  }

  function del(key) {
    return withTimeout(client.del(key));
  }

  function psetex(key, ttl, value) {
    return withTimeout(client.psetexBuffer(key, ttl, encrypt(value)));
  }

  function withTimeout(promise) {
    return Promise.race([timeout(TIMEOUT), promise]);
  }

  function timeout(t) {
    return delay(t).then(() => Promise.reject(new Error(`operation timed out after ${t} milliseconds`)));
  }

  function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  function encrypt(plaintext) {
    return emCrypto.encrypt(cryptoKey, new Buffer(JSON.stringify(plaintext)));
  }

  function decrypt(ciphertext) {
    return JSON.parse(emCrypto.decrypt(cryptoKey, ciphertext).toString());
  }

  return {
    status,
    get,
    del,
    psetex
  };
}

function connectToRedis(db) {
  let client = new Redis({
    host: EM_REDIS_ADDRESS,
    port: EM_REDIS_PORT,
    db,
    lazyConnect: true,
    connectTimeout: 1000,
    reconnectOnError: () => {
      return 2;
    }
  });

  let events = ['close', 'connect', 'end', 'error', 'ready', 'reconnecting'];
  events.forEach((name) => {
    client.on(name, (e) => {
      logger.debug(`${name}: redis ${EM_REDIS_ADDRESS}:${EM_REDIS_PORT}`);
      if (e) {
        logger.debug(e);
      }
    });
  });
  client.on('error', e => logger.error(e));
  return client;
}

function getCryptoKey() {
  if (EM_REDIS_CRYPTO_KEY) {
    return Promise.resolve(EM_REDIS_CRYPTO_KEY);
  } else if (EM_REDIS_CRYPTO_KEY_S3_BUCKET && EM_REDIS_CRYPTO_KEY_S3_KEY) {
    return masterAccountClient.createS3Client().then(s3 => s3.getObject({
      Bucket: EM_REDIS_CRYPTO_KEY_S3_BUCKET,
      Key: EM_REDIS_CRYPTO_KEY_S3_KEY
    }).promise()).then(rsp => rsp.Body, (error) => {
      logger.warn(`Failed to get Redis Crypto Key: Bucket=${EM_REDIS_CRYPTO_KEY_S3_BUCKET} Key=${EM_REDIS_CRYPTO_KEY_S3_KEY}`);
      logger.error(error);
      return Promise.resolve();
    });
  } else {
    return Promise.resolve();
  }
}

module.exports = {
  createStore
};


/***/ }),
/* 180 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



module.exports = function SSLComponentsRepository() {
  this.get = function () {
    return Promise.resolve({
      privateKey: `-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQCKqo+T1gWfmXO5sxVHECRmIK109holtPp9PnXWH01SP7zY1Syo
5MzLnewmsdXqlkp7jMQdAi4fDcbb4VCA9PX3roOcHQWL+tjCaLMAJ/24yff65cnL
YSpWSDSF79ijxPmEBlml273KT/+t53BIzGK5SDBoh3JMtjFTLz9HH+PFWwIDAQAB
AoGAEZmAS6U4ZX9WftVJ+BEGbafsHBI4U1zbBhZtYlXqvGu2jlbQKkeP7rAGjwq3
OeUFYxUEtyHVtL9M5A9+5j8xEKTCmrhCs0MeN3VccmvB6ePlNM49KAA5fZcf7xee
IIibarSqQwh5VAnLvb08KBNYk/rtDT9piMMAEl2uR5sJXwECQQDGti5Ny7Dm+vCZ
uztRAwBLUbtis/O2Jw7kgaObhACXlE2jgGQuLNq+OAzPfTx7FJ/35Nhjl8PXqdam
DHey+xlBAkEAsqTCHF69qSYwPoFY3nqEHmhtUyLyJ6x+lXLM7DTfC8nvSiLSbbls
Dp3ZUrxo+Hau50Dos27vJ4F5R/5jiym7mwJAJCwhvbOonkNr7PAyWgrr0MouDEep
w6zUfzBCMhsTaIRspajHk8hCgYH+gv7PNbCJdjzIT0jfM7ENC+kVGRWwgQJADm7v
W/lvm24Bcdtjgb4mVIqdYp0tMXVnWM3IrsDq0HoFQlkj5UeY6mloeJ3OYVy9buO4
qV6qJef5E48DHehGRwJBAKmSv8vkdcC6ITaal62Teuly68r/SN9GR40TkPRUALEQ
b8SAV6DI+hOqRW5bzSCiayKPUiDrNV6ZtqRfTHPHQ/o=
-----END RSA PRIVATE KEY-----`,
      certificate: `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCKqo+T1gWfmXO5sxVHECRmIK10
9holtPp9PnXWH01SP7zY1Syo5MzLnewmsdXqlkp7jMQdAi4fDcbb4VCA9PX3roOc
HQWL+tjCaLMAJ/24yff65cnLYSpWSDSF79ijxPmEBlml273KT/+t53BIzGK5SDBo
h3JMtjFTLz9HH+PFWwIDAQAB
-----END PUBLIC KEY-----`
    });
  };
};


/***/ }),
/* 181 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let async = __webpack_require__(182);
let S3GetObjectRequest = __webpack_require__(97);
let amazonClientFactory = __webpack_require__(16);
const SslComponentsRepositoryConfiguration = __webpack_require__(183);
let sslComponentsCache = null;

module.exports = function SSLComponentsRepository() {
  let sslComponentsRepositoryConfiguration = new SslComponentsRepositoryConfiguration();

  this.get = function () {
    return new Promise((resolve, reject) => {
      if (sslComponentsCache) {
        resolve(sslComponentsCache);
      } else {
        loadSSLComponentsFromS3((error, sslComponents) => {
          if (error) reject(error);
          else {
            sslComponentsCache = sslComponents;
            resolve(sslComponents);
          }
        });
      }
    });
  };

  function loadSSLComponentsFromS3(mainCallback) {
    async.waterfall([
      // Creates a new instance of S3 client
      (callback) => {
        amazonClientFactory.createS3Client().then(
          client => callback(null, client),
          error => callback(error)
        );
      },

      // SSL private key and certificate files are stored on S3.
      // Following function creates a couple of request in order to download
      // these two S3 objects.
      (client, callback) => {
        let privateKeyRequestParameters = {
          bucketName: sslComponentsRepositoryConfiguration.getBucketName(),
          objectPath: sslComponentsRepositoryConfiguration.getPrivateKeyObjectPath()
        };

        let privateKeyRequest = new S3GetObjectRequest(client, privateKeyRequestParameters);

        let certificateRequestParameters = {
          bucketName: sslComponentsRepositoryConfiguration.getBucketName(),
          objectPath: sslComponentsRepositoryConfiguration.getCertificateObjectPath()
        };

        let certificateRequest = new S3GetObjectRequest(client, certificateRequestParameters);

        async.parallel({
          privateKeyS3Object: privateKeyRequest.execute,
          certificateS3Object: certificateRequest.execute
        }, callback);
      },

      // Previous function returns a couple of S3 objects. The following one
      // gets their content.
      (response, callback) => {
        callback(null, {
          privateKey: response.privateKeyS3Object.Body.toString('utf8'),
          certificate: response.certificateS3Object.Body.toString('utf8')
        });
      }
    ], mainCallback);
  }
};


/***/ }),
/* 182 */
/***/ (function(module, exports) {

module.exports = require("async");

/***/ }),
/* 183 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let config = __webpack_require__(5);

module.exports = function SSLComponentsRepositoryConfiguration() {
  let configuration = loadConfiguration();

  this.getBucketName = () => configuration.bucketName;
  this.getPrivateKeyObjectPath = () => configuration.privateKeyObjectPath;
  this.getCertificateObjectPath = () => configuration.certificateObjectPath;

  function loadConfiguration() {
    let localConfig = config.getUserValue('local');

    assert(localConfig.server, 'missing \'server\' field in configuration');
    assert(localConfig.server.ssl, 'missing \'server.ssl\' field in configuration');
    assert(localConfig.server.ssl.S3, 'missing \'server.ssl.S3\' field in configuration');
    assert(localConfig.server.ssl.S3.bucket, 'missing \'server.ssl.S3.bucket\' field in configuration');
    assert(localConfig.server.ssl.S3.key, 'missing \'server.ssl.S3.key\' field in configuration');
    assert(localConfig.server.ssl.S3.cert, 'missing \'server.ssl.S3.cert\' field in configuration');

    return {
      bucketName: localConfig.server.ssl.S3.bucket,
      privateKeyObjectPath: localConfig.server.ssl.S3.key,
      certificateObjectPath: localConfig.server.ssl.S3.cert
    };
  }
};


/***/ }),
/* 184 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



function isUserAuthenticated(user) {
  return !!user;
}

module.exports = {
  allowUnknown(request, response, next) {
    return next();
  },

  denyUnauthorized(request, response, next) {
    // User not authenticated
    if (!isUserAuthenticated(request.user)) {
      response.status(403);
      response.json({
        error: 'Access denied. Please log in'
      });
    } else {
      next();
    }
  }
};


/***/ }),
/* 185 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let logger = __webpack_require__(2);
let deploymentMonitor = __webpack_require__(186);
const MAX_MONITOR_INTERVAL = 60;
const MIN_MONITOR_INTERVAL = 45;

let monitorInterval = 0;

function scheduleDeploymentMonitor(isPeakTime) {
  let interval = getDeploymentMonitorInterval(isPeakTime);

  logger.debug(`DeploymentMonitor: Next execution will start in ${interval} seconds`);

  setTimeout(() => {
    deploymentMonitor.monitorActiveDeployments().then(

      (activeDeploymentsMonitored) => {
        scheduleDeploymentMonitor(activeDeploymentsMonitored > 0);
      },

      (error) => {
        logger.error(`DeploymentMonitor: An error has occurred: ${error.toString(true)}`);
        scheduleDeploymentMonitor(false);
      }

    );
  }, interval * 1000);
}

function getDeploymentMonitorInterval(isPeakTime) {
  if (isPeakTime) {
    monitorInterval = 0;
  } else {
    monitorInterval *= 2;
  }

  if (monitorInterval > MAX_MONITOR_INTERVAL) {
    monitorInterval = MAX_MONITOR_INTERVAL;
  } else if (monitorInterval < MIN_MONITOR_INTERVAL) {
    monitorInterval = MIN_MONITOR_INTERVAL;
  }

  return monitorInterval;
}

module.exports = {
  start() {
    scheduleDeploymentMonitor(false);
  }
};


/***/ }),
/* 186 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let fs = __webpack_require__(27);
let co = __webpack_require__(0);
let ms = __webpack_require__(42);
let logger = __webpack_require__(2);
let activeDeploymentsStatusProvider = __webpack_require__(99);

let DEFAULT_INFRASTRUCTURE_PROVISIONING_TIMEOUT = '60m';
let Enums = __webpack_require__(11);
let NodeDeploymentStatus = __webpack_require__(11).NodeDeploymentStatus;
let deploymentLogger = __webpack_require__(59);

module.exports = {
  detectNodesDeploymentStatus,
  monitorActiveDeployments() {
    try {
      let stats = fs.lstatSync('DONT_RUN_DEPLOYMENT_MONITOR');
      if (stats.isFile()) {
        // Return 0 monitored deployments
        logger.info('DeploymentMonitor: DONT_RUN_DEPLOYMENT_MONITOR env is defined, so not running');
        return Promise.resolve(0);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        // If error is other than not found file, rethrow
        throw err;
      }
    }

    return co(function* () {
      let activeDeployments = yield activeDeploymentsStatusProvider.all();
      let activeDeploymentsStatus = yield activeDeploymentsStatusProvider.getActiveDeploymentsFullStatus(activeDeployments);

      yield activeDeploymentsStatus.map(
        activeDeploymentStatus => monitorActiveDeploymentStatus(activeDeploymentStatus)
      );

      return activeDeploymentsStatus.length;
    });
  }
};

function monitorActiveDeploymentStatus(deploymentStatus) {
  return co(function* () {
    if (deploymentStatus.error) {
      if (deploymentStatus.error.indexOf('Missing credentials in config') !== -1) {
        // That is to not modify deployment if we catch mysterious 'Missing credentials' from AWS
        return;
      }

      let newStatus = {
        name: Enums.DEPLOYMENT_STATUS.Failed,
        reason: sanitiseError(deploymentStatus.error)
      };
      deploymentLogger.updateStatus(deploymentStatus, newStatus);
      return;
    }

    // Checking the overall deployment execution time does not exceeded the timeout.
    // This execution time takes into account creation of AWS expected infrastructure,
    // EC2 Instances bootstrapping, and service installation on them.
    if (isOverallDeploymentTimedOut(deploymentStatus.startTime)) {
      let newStatus = {
        name: Enums.DEPLOYMENT_STATUS.Failed,
        reason: `Deployment failed because exceeded overall timeout of ${DEFAULT_INFRASTRUCTURE_PROVISIONING_TIMEOUT}`
      };
      deploymentLogger.updateStatus(deploymentStatus, newStatus);
      return;
    }

    timeOutNodes(deploymentStatus.nodesDeployment, deploymentStatus.installationTimeout);
    let newStatus = detectNodesDeploymentStatus(deploymentStatus.nodesDeployment);

    logger.debug(`DeploymentMonitor: Deployment '${deploymentStatus.deploymentId}' nodes status is ${JSON.stringify(newStatus)}`);

    if (newStatus.name === Enums.DEPLOYMENT_STATUS.InProgress) {
      return;
    }

    if (newStatus.name === Enums.DEPLOYMENT_STATUS.Success || newStatus.name === Enums.DEPLOYMENT_STATUS.Failed) {
      deploymentLogger.updateStatus(deploymentStatus, newStatus);
    }
  });
}

function sanitiseError(error) {
  if (_.isObjectLike(error)) { return JSON.stringify(error); }
  return error.toString(true);
}

function isOverallDeploymentTimedOut(deploymentStartTime) {
  let initialTime = new Date(deploymentStartTime);
  let currentTime = new Date();
  let elapsedMs = currentTime.getTime() - initialTime.getTime();

  let timedOut = elapsedMs > ms(DEFAULT_INFRASTRUCTURE_PROVISIONING_TIMEOUT);

  return timedOut;
}

function detectNodesDeploymentStatus(nodes) {
  let totalNodeCount = nodes.length;

  if (totalNodeCount < 1) {
    // There are no nodes yet. Maybe an ASG is being created or scaled out from zero?
    return { name: Enums.DEPLOYMENT_STATUS.InProgress };
  }

  if (nodes.every(succeeded)) {
    // Deployment succeeded on every node.
    return {
      name: Enums.DEPLOYMENT_STATUS.Success,
      reason: 'Deployed all nodes successfully'
    };
  }

  if (nodes.every(completed)) {
    let succeededLength = _.filter(nodes, succeeded).length;
    // Deployment completed on every node but did not succeeded on every node.
    return {
      name: Enums.DEPLOYMENT_STATUS.Failed,
      reason: `Deployment failed: deployed ${succeededLength}/${nodes.length} nodes`
    };
  }

  return { name: Enums.DEPLOYMENT_STATUS.InProgress };

  function succeeded(node) {
    return node.Status === NodeDeploymentStatus.Success;
  }

  function completed(node) {
    return node.Status === NodeDeploymentStatus.Success || node.Status === NodeDeploymentStatus.Failed;
  }
}

function timeOutNodes(nodesDeployment, installationTimeout) {
  nodesDeployment.forEach((nodeDeployment) => {
    if (isNodeDeploymentTimedOut(nodeDeployment, installationTimeout)) {
      nodeDeployment.Status = NodeDeploymentStatus.Failed;
      nodeDeployment.LastCompletedStage = 'Timed Out';
    }
  });
}

function isNodeDeploymentTimedOut(nodeDeployment, installationTimeout) {
  if (nodeDeployment.Status !== NodeDeploymentStatus.InProgress) return false;

  let initialTime = new Date(nodeDeployment.StartTime);
  let currentTime = new Date();
  let elapsedMs = currentTime.getTime() - initialTime.getTime();

  let timedOut = elapsedMs > installationTimeout;

  return timedOut;
}


/***/ }),
/* 187 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function DynamoItemNotFoundError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 188 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);

module.exports = function Image(imageSummary) {
  assert(imageSummary, 'Expected "ami" argument not to be null.');

  this.id = imageSummary.ImageId;
  this.creationDate = imageSummary.CreationDate;
  this.platform = imageSummary.Platform;
  this.name = imageSummary.Name;
  this.description = imageSummary.Description;
  this.type = imageSummary.AmiType;
  this.version = imageSummary.AmiVersion;
  this.isCompatibleImage = imageSummary.IsCompatibleImage;
  this.encrypted = imageSummary.Encrypted;
  this.isStable = imageSummary.IsStable;
  this.rootVolumeSize = imageSummary.RootVolumeSize;
};


/***/ }),
/* 189 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function ImageNotFoundError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 190 */
/***/ (function(module, exports) {

module.exports = require("semver");

/***/ }),
/* 191 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let ResourceNotFoundError = __webpack_require__(37);
let deploymentMaps = __webpack_require__(104);

class DeploymentMap {

  constructor(data) {
    _.assign(this, data);
  }

  static getByName(deploymentMapName) {
    return deploymentMaps.get({ DeploymentMapName: deploymentMapName })
      .then(deploymentMap => (deploymentMap !== null
        ? new DeploymentMap(deploymentMap.Value)
        : Promise.reject(new ResourceNotFoundError(`Deployment map "${deploymentMapName}" not found.`))),
        error => Promise.reject(
          new Error(`An error has occurred retrieving "${deploymentMapName}" deployment map: ${error.message}`)));
  }

  getServerRolesByServiceName(serviceName) {
    let deploymentTargets = this.DeploymentTarget.filter(target =>
      target.Services.some(service => service.ServiceName === serviceName)
    );

    if (deploymentTargets.length === 0) {
      throw new ResourceNotFoundError(
        `Target server role cannot be identified through "${serviceName}" service because there ` +
        'is no reference to it in the deployment map.'
      );
    }

    return deploymentTargets;
  }

}

module.exports = DeploymentMap;


/***/ }),
/* 192 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
const asgResourceFactory = __webpack_require__(25);

function* handleQuery(query) {
  // Create an instance of the resource to work with based on the resource
  // descriptor and AWS account name.
  let parameters = { accountName: query.accountName };
  let resource = yield asgResourceFactory.create(undefined, parameters);

  // Get AutoScalingGroup by name
  return resource.get({ name: query.autoScalingGroupName, clearCache: query.clearCache });
}

module.exports = co.wrap(handleQuery);


/***/ }),
/* 193 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let AsgResourceBase = __webpack_require__(106);
let AutoScalingGroup = __webpack_require__(19);

function AsgResource(accountId) {
  const base = new AsgResourceBase(accountId);
  const self = Object.create(new AsgResourceBase(accountId));
  self.get = function (parameters) {
    return base.get(parameters).then(x => new AutoScalingGroup(x));
  };
  self.all = function (parameters) {
    return base.all(parameters).then(xs => xs.map(x => new AutoScalingGroup(x)));
  };
  return self;
}

module.exports = AsgResource;


/***/ }),
/* 194 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function AutoScalingGroupAlreadyExistsError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 195 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let ConsulManager = __webpack_require__(196);
let co = __webpack_require__(0);
let consulClient = __webpack_require__(44);

function* setInstanceMaintenanceMode(accountName, host, environment, enable) {
  let options = { accountName, host, environment };
  let consulManager = yield consulClient.create(options).then(client => new ConsulManager(client));

  yield consulManager.setServerMaintenanceMode(enable);
}

module.exports = {
  setInstanceMaintenanceMode: co.wrap(setInstanceMaintenanceMode)
};


/***/ }),
/* 196 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let Promise = __webpack_require__(10);
let logger = __webpack_require__(2);

module.exports = class ConsulManager {
  constructor(client) {
    this.client = client;
  }

  setServerMaintenanceMode(enable) {
    logger.debug(`consul: setting maintenance mode to ${enable}`);
    let promisified = Promise.promisify(this.client.agent.maintenance, { context: this.client.agent });
    return promisified({ enable, reason: 'Maintanance mode triggered from EnvironmentManager' }).catch((err) => {
      throw new Error(`Couldn't connect to consul client: ${err.message}`);
    });
  }
};


/***/ }),
/* 197 */
/***/ (function(module, exports) {

module.exports = require("consul");

/***/ }),
/* 198 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



module.exports = parameters => (
  Promise.resolve({
    host: '10.249.16.74',
    port: '8500',
    defaults: {
      dc: 'tl-c50'
    },
    promisify: parameters.promisify
  })
);


/***/ }),
/* 199 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let configurationCache = __webpack_require__(57);
let consulSecretCache = __webpack_require__(200);
let _ = __webpack_require__(1);

function* getConsulClientOptions(parameters) {
  let environmentName = parameters.environment;
  let environment = yield configurationCache.getEnvironmentByName(environmentName);
  let environmentType = yield configurationCache.getEnvironmentTypeByName(environment.EnvironmentType);
  let consul = environmentType.Consul;
  let secret = yield consulSecretCache.get(consul.SecurityTokenPath);
  let token = secret.consul.token;
  if (token === null) {
    token = undefined;
  }

  // if host is undefined, we connect to a random consul agent
  let host = (parameters.host !== undefined) ? parameters.host : _.sample(consul.Servers);

  let options = {
    host,
    port: consul.Port,
    defaults: {
      dc: consul.DataCenter,
      token
    }
  };

  options.promisify = parameters.promisify;
  return options;
}

module.exports = co.wrap(getConsulClientOptions);


/***/ }),
/* 200 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let awsMasterClient = __webpack_require__(16);
let cacheManager = __webpack_require__(34);
let logger = __webpack_require__(2);

const TTL = 10 * 60; // seconds

cacheManager.create('ConsulToken', createToken, { stdTTL: TTL });

/**
 * retrieve a ConsulToken
 * @param {s3Location} s3Location - the S3 bucket and key
 */
function getToken(s3Location) {
  let cacheKey = JSON.stringify(s3Location);
  return cacheManager.get('ConsulToken').get(cacheKey);
}

function createToken(cacheKey) {
  let query = Object.assign({}, JSON.parse(cacheKey));
  return awsMasterClient.createS3Client()
    .then(client => client.getObject(query).promise())
    .then(response => JSON.parse(response.Body.toString('utf8')))
    .catch((error) => {
      logger.error(`Failed to get Consul token from ${cacheKey}`);
      return Promise.reject(error);
    });
}

module.exports = {
  get: getToken
};


/***/ }),
/* 201 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let utils = __webpack_require__(51);
let ResourceNotFoundError = __webpack_require__(37);
let HttpRequestError = __webpack_require__(77);
let consulClient = __webpack_require__(44);
let logger = __webpack_require__(2);
let retry = __webpack_require__(108);
let _ = __webpack_require__(1);

function encodeValue(value) {
  if (!value) return null;
  return (typeof value === 'object') ? JSON.stringify(value) : value;
}

function decodeValue(encodedValue) {
  if (!encodedValue) return null;
  let value = utils.safeParseJSON(encodedValue);
  return value || encodedValue;
}

function asKeyValuePair(item) {
  return {
    key: item.Key,
    value: decodeValue(item.Value)
  };
}

function getTargetState(environment, parameters) {
  assert(parameters, 'Expected "parameters" not to be null or empty.');

  let promiseFactoryMethod = () => createConsulClient(environment).then(clientInstance => clientInstance.kv.get({ key: parameters.key, recurse: parameters.recurse }).catch((error) => {
    throw new HttpRequestError(`An error has occurred contacting consul agent: ${error.message}`);
  }).then((result) => {
    if (parameters.recurse) {
      let data = result ? result.map(asKeyValuePair) : [];
      return data;
    }
    if (result) {
      return asKeyValuePair(result);
    }
    throw new ResourceNotFoundError(`Key "${parameters.key}" in Consul key/value storage has not been found.`);
  }));

  return executeAction(promiseFactoryMethod);
}

function getAllServiceTargets(environmentName, runtimeServerRole) {
  assert(runtimeServerRole, 'runTimeServerRole needs to be defined');
  assert(environmentName, 'environmentName needs to be defined');
  let key = `environments/${environmentName}/roles/${runtimeServerRole}/services`;
  return getTargetState(environmentName, { key, recurse: true }).then(data => _.map(data, 'value'))
    .then((data) => {
      // Note: this is for backwards compatibility. Once all server role services have "Action" attribute, we can remove that
      _.each(data, (service) => {
        if (service.Action === undefined) {
          service.Action = 'Install';
        }
      });
      return data;
    });
}

function getInstanceServiceDeploymentInfo(environmentName, deploymentId, instanceId) {
  let key = `deployments/${deploymentId}/nodes/${instanceId}`;
  return getTargetState(environmentName, { key, recurse: true }).then(data => _.get(data, '[0].value'));
}

function getServiceDeploymentCause(environmentName, deploymentId, instanceId) {
  let key = `deployments/${deploymentId}/nodes/${instanceId}`;
  let value = '[0].value.Cause';
  let defaultValue = 'Unknown';

  return getTargetState(environmentName, { key, recurse: true }).then(data => _.get(data, value, defaultValue));
}

function setTargetState(environment, parameters) {
  assert(parameters, 'Expected "parameters" not to be null or empty.');
  let promiseFactoryMethod = () => new Promise((resolve, reject) => {
    createConsulClient(environment).then((clientInstance) => {
      let encodedValue = encodeValue(parameters.value);
      let options = {};

      if (parameters.options) {
        if (parameters.options.expectedVersion !== undefined) {
          options.cas = parameters.options.expectedVersion;
        }
      }
      clientInstance.kv.set(parameters.key, encodedValue, options, (error, created) => {
        if (error) {
          return reject(new HttpRequestError(
            `An error has occurred contacting consul agent: ${error.message}`
          ));
        }
        if (!created) {
          return reject(new Error(
            `Consul '${parameters.key}' key cannot be updated`
          ));
        }
        logChange('SET', parameters.key, encodedValue);
        return resolve();
      });
    });
  });
  return executeAction(promiseFactoryMethod);
}

function removeRuntimeServerRoleTargetState(environmentName, runtimeServerRoleName) {
  return removeTargetState(environmentName, {
    key: `environments/${environmentName}/roles/${runtimeServerRoleName}`,
    recurse: true
  });
}

function removeTargetState(environment, { key, recurse }) {
  assert(key, 'Expected "key" not to be null or empty.');
  let promiseFactoryMethod = () => new Promise((resolve, reject) => {
    createConsulClient(environment).then((clientInstance) => {
      clientInstance.kv.get({ key, recurse }, (getError, result) => {
        clientInstance.kv.del({ key, recurse }, (delError) => {
          if (!delError) {
            logChange('DELETE', key, result);
            return resolve();
          }
          return reject(new HttpRequestError(
            `An error has occurred contacting consul agent: ${delError.message}`
          ));
        });
      });
    });
  });

  return executeAction(promiseFactoryMethod);
}

function executeAction(promiseFactoryMethod) {
  let operation = retry.operation({
    retries: 3,
    minTimeout: 1000
  });

  return new Promise((resolve, reject) => {
    operation.attempt(() => {
      promiseFactoryMethod()
        .then(result => resolve(result))
        .catch((error) => {
          if ((error instanceof HttpRequestError) && operation.retry(error)) return;
          reject(error);
        });
    });
  });
}

function createConsulClient(environment) {
  return consulClient.create({ environment, promisify: true });
}

function logChange(operation, key, value) {
  logger.debug(`Consul key value store operation: ${operation} ${key}. ${value}`);
}

module.exports = {
  getTargetState,
  setTargetState,
  removeTargetState,
  removeRuntimeServerRoleTargetState,
  getAllServiceTargets,
  getServiceDeploymentCause,
  getInstanceServiceDeploymentInfo
};


/***/ }),
/* 202 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function LaunchConfigurationAlreadyExistsError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 203 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let User = __webpack_require__(71);
let systemUser = User.new('System', null, [], [{ Access: 'ADMIN', Resource: '**' }]);

module.exports = systemUser;


/***/ }),
/* 204 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const swaggerTools = __webpack_require__(205);
const config = __webpack_require__(5);
const swaggerAuthorizer = __webpack_require__(206);
const swaggerNewRelic = __webpack_require__(227);
const defaultErrorHandler = __webpack_require__(230);
const apiSpec = __webpack_require__(117);
const controllers = __webpack_require__(231);

const NODE_ENV = process.env.NODE_ENV;
const API_BASE_PATH = apiSpec.basePath;

if (config.get('IS_PRODUCTION') === false) {
  apiSpec.host = 'localhost:8080';
  apiSpec.schemes = ['http'];
}

let swaggerOptions = { controllers: controllers() };

function setup() {
  return new Promise((resolve, reject) => {
    try {
      swaggerTools.initializeMiddleware(apiSpec, ({ swaggerMetadata, swaggerValidator, swaggerRouter, swaggerUi }) => {
        let result = {
          swaggerAuthorizer: swaggerAuthorizer(),
          swaggerBasePath: API_BASE_PATH,
          swaggerErrorHandler: defaultErrorHandler,
          swaggerMetadata: swaggerMetadata(),
          swaggerRouter: swaggerRouter(swaggerOptions),
          swaggerUi: swaggerUi(),
          swaggerValidator: swaggerValidator({ validateResponse: NODE_ENV === 'development' }),
          swaggerNewRelic
        };
        resolve(Object.freeze(result));
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = setup;


/***/ }),
/* 205 */
/***/ (function(module, exports) {

module.exports = require("swagger-tools");

/***/ }),
/* 206 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let authorization = __webpack_require__(207);
let authorizers = __webpack_require__(210);

function authorize(req, res, next) {
  if (req.swagger === undefined) {
    next();
    return;
  }

  // We need to rewrite this for authorizers to work with swagger
  _.each(req.swagger.params, (param, key) => {
    req.params[key] = param.value;
  });

  let authorizerName = req.swagger.operation['x-authorizer'] || 'simple';

  if (authorizerName !== 'allow-anonymous') {
    let authorizer = authorizers[authorizerName];
    authorization(authorizer, req, res, next);
  } else {
    next();
  }
}

module.exports = () => authorize;


/***/ }),
/* 207 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let logger = __webpack_require__(2);
let authorize = __webpack_require__(208);

let errorResponseCodes = {
  BadRequestError: 400,
  ResourceNotFoundError: 404
};

function authorizeRequest(authorizer, request, response, next) {
  if (!request.user) {
    response.status(401);
    return response.send('Access Denied. Please sign in and try again.');
  } else {
    if (request.method === 'GET') return next();
    return handleSecureRequest(authorizer, request, response, next);
  }
}

function handleSecureRequest(authorizer, request, response, next) {
  let usersPermissions = request.user.getPermissions();
  authorizer.getRules(request).then((requiredPermissions) => {
    logRequestAndRequirements(request, requiredPermissions, usersPermissions);

    let authorizationResult = authorize(usersPermissions, requiredPermissions);
    logResult(authorizationResult);

    if (authorizationResult.authorized) return next();

    if (authorizationResult.protectedAction !== undefined) {
      return sendProtectedActionResponse(
        authorizationResult.protectedAction,
        authorizationResult.environmentType,
        response
      );
    } else {
      return sendUnauthorizedResponse(authorizationResult.unsatisfiedPermissions, response);
    }
  }).catch((error) => {
    let errorCode = errorResponseCodes[error.name];
    if (errorCode) {
      response.status(errorCode);
      response.send(error.message);
    } else {
      sendAuthorizationErrorResponse(error, response);
    }
  });
}

function sendProtectedActionResponse(action, envType, response) {
  response.status(403);
  response.send(`The Environment Type '${envType}' is protected against ${action} operations`);
}

function sendAuthorizationErrorResponse(error, response) {
  logger.error(`An error has occurred authorizing user: ${error.message}`);
  logger.error(error.toString(true));
  logger.error(error.stack);

  response.status(500);
  response.send('An error has occurred. Please try again.');
}

function sendUnauthorizedResponse(unsatisfiedPermissions, response) {
  // TODO: Return data instead of pre-rendered HTML
  let message = 'You are not authorized to perform that action. You are missing the following permissions: <br \><br \>';

  unsatisfiedPermissions.forEach((permission) => {
    message += `* ${permission.access} > ${permission.resource}`;
    if (permission.clusters) {
      message += ` / clusters: ${permission.clusters.join(', ')}`;
    }
    if (permission.environmentTypes) {
      message += ` / environment types: ${permission.environmentTypes.join(', ')}`;
    }
    message += '<br \>';
  });

  response.status(403);
  response.send(message);
}

function logRequestAndRequirements(request, requiredPermissions, usersPermissions) {
  logger.info({
    method: request.method,
    url: request.url,
    user: request.user.getName()
  }, `Authorizing ${request.method} ${request.url} request`);

  if (requiredPermissions) {
    logger.info({
      requiredPermissions,
      usersPermissions,
      user: request.user.getName()
    }, `Authorizing ${request.user.getName()} user`);
  }
}

function logResult(authorizationResult) {
  if (authorizationResult.authorized) logger.info('Authorised');
  else logger.info('Not Authorized');

  logger.info('');
}

module.exports = authorizeRequest;


/***/ }),
/* 208 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let intersect = __webpack_require__(209);

module.exports = (usersPermissions, requiredPermissions) => {
  let protectedEnvironment = _.find(requiredPermissions, rp => rp.protectedAction !== undefined);
  if (protectedEnvironment !== undefined) {
    // The requested action is not permitted against the given environment
    return {
      authorized: false,
      protectedAction: protectedEnvironment.protectedAction,
      environmentType: protectedEnvironment.environmentTypes[0]
    };
  }

  // Else check other permissions
  let unsatisfiedPermissions =
    requiredPermissions.filter(requiredPermission => !permissionIsSatisfied(requiredPermission, usersPermissions));

  return {
    authorized: unsatisfiedPermissions.length === 0,
    unsatisfiedPermissions: _.uniqWith(unsatisfiedPermissions, _.isEqual)
  };
};

function permissionIsSatisfied(requiredPermission, usersPermissions) {
  let matchingPermissionFound = false;
  let resourceSatisfied = false;
  let requiredClusters = toRequiredAttributes(requiredPermission.clusters);
  let requiredEnvironmentTypes = toRequiredAttributes(requiredPermission.environmentTypes);

  usersPermissions.forEach((permission) => {
    if (resourceAndAccessMatch(requiredPermission, permission)) {
      if (!isLimitedResourcePermission(permission)) {
        resourceSatisfied = true;
      } else if (limitationsOnResourcePermissionMatch(requiredPermission, permission)) {
        matchingPermissionFound = true;
      }
    }

    if (isClusterPermission(permission)) {
      satisfyRequiredClustersFromClusterPermission(requiredClusters, permission);
    }

    if (isEnvironmentTypePermission(permission)) {
      satisfyRequiredEnvironmentTypesFromEnvironmentTypePermission(requiredEnvironmentTypes, permission);
    }
  });

  return matchingPermissionFound || (resourceSatisfied &&
    attributesAreSatisfied(requiredClusters) &&
    attributesAreSatisfied(requiredEnvironmentTypes));
}

function limitationsOnResourcePermissionMatch(requiredPermission, permission) {
  let requiredClusters = toRequiredAttributes(requiredPermission.clusters);
  let requiredEnvironmentTypes = toRequiredAttributes(requiredPermission.environmentTypes);

  if (isClusterLimitedResourcePermission(permission)) {
    satisfyRequiredClustersFromResourcePermission(requiredClusters, permission);
  }

  if (isEnvironmentTypeLimitedResourcePermission(permission)) {
    satisfyRequiredEnvironmentTypesFromResourcePermission(requiredEnvironmentTypes, permission);
  }

  return attributesAreSatisfied(requiredClusters) && attributesAreSatisfied(requiredEnvironmentTypes);
}

function isClusterPermission(permission) {
  let isLegacyClusterPermission = intersect(toLower(permission.Resource), '/permissions/clusters/*');
  let hasPermission = !!permission.Cluster;
  return hasPermission || isLegacyClusterPermission;
}

function isEnvironmentTypePermission(permission) {
  let isLegacyEnvironmentTypePermission = intersect(toLower(permission.Resource), '/permissions/environmenttypes/*');
  let hasPermission = !!permission.EnvironmentType;
  return hasPermission || isLegacyEnvironmentTypePermission;
}

function isLimitedResourcePermission(permission) {
  return isClusterLimitedResourcePermission(permission) ||
    isEnvironmentTypeLimitedResourcePermission(permission);
}

function isClusterLimitedResourcePermission(permission) {
  return permission.Clusters;
}

function isEnvironmentTypeLimitedResourcePermission(permission) {
  return permission.EnvironmentTypes;
}

function satisfyRequiredClustersFromResourcePermission(requiredClusters, permission) {
  requiredClusters.forEach((requiredCluster) => {
    if (typeof permission.Clusters === 'string' && permission.Clusters.toLowerCase() === 'all') {
      requiredCluster.satisfied = true;
    } else {
      permission.Clusters.forEach((permittedCluster) => {
        if (permittedCluster === requiredCluster.name) {
          requiredCluster.satisfied = true;
        }
      });
    }
  });
}

function satisfyRequiredEnvironmentTypesFromResourcePermission(requiredEnvironmentTypes, permission) {
  requiredEnvironmentTypes.forEach((requiredEnvironmentType) => {
    if (typeof permission.EnvironmentTypes === 'string' && permission.EnvironmentTypes.toLowerCase() === 'all') {
      requiredEnvironmentType.satisfied = true;
    } else {
      permission.EnvironmentTypes.forEach((permittedEnvironmentType) => {
        if (permittedEnvironmentType === requiredEnvironmentType.name) {
          requiredEnvironmentType.satisfied = true;
        }
      });
    }
  });
}

function satisfyRequiredClustersFromClusterPermission(requiredClusters, permission) {
  requiredClusters.forEach((requiredCluster) => {
    let permittedCluster = toLower(permission.Cluster);

    let matchingCluster = (permittedCluster === 'all' || permittedCluster === requiredCluster.name);
    let matchingLegacyCluster = intersect(toLower(permission.Resource), `/permissions/clusters/${requiredCluster.name}`);

    if (matchingCluster || matchingLegacyCluster) {
      requiredCluster.satisfied = true;
    }
  });
}

function satisfyRequiredEnvironmentTypesFromEnvironmentTypePermission(requiredEnvironmentTypes, permission) {
  requiredEnvironmentTypes.forEach((requiredEnvironmentType) => {
    let permittedEnvironmentType = toLower(permission.EnvironmentType);

    let matchingEnvironmentType = (permittedEnvironmentType === 'all' || permittedEnvironmentType === requiredEnvironmentType.name);
    let matchingLegacyEnvironmentType = intersect(toLower(permission.Resource), `/permissions/environmenttypes/${requiredEnvironmentType.name}`);

    if (matchingEnvironmentType || matchingLegacyEnvironmentType) {
      requiredEnvironmentType.satisfied = true;
    }
  });
}

function attributesAreSatisfied(attributes) {
  return attributes.every(attr => attr.satisfied);
}

function toRequiredAttributes(attributes) {
  if (!(attributes && attributes.length > 0)) return [];
  return attributes.map(attribute => ({
    name: attribute.toLowerCase(),
    satisfied: false
  }));
}

function resourceAndAccessMatch(requiredPermission, permission) {
  let requiredResource = requiredPermission.resource.toLowerCase();
  let requiredAccess = requiredPermission.access.toLowerCase();

  let permittedResource = toLower(permission.Resource);
  let permittedAccess = toLower(permission.Access);

  let resourceMatches = intersect(permittedResource, requiredResource);
  let accessMatches = permittedAccess === requiredAccess || permittedAccess === 'admin';

  return resourceMatches && accessMatches;
}

function toLower(str) {
  if (str) return str.toLowerCase();
  return '';
}


/***/ }),
/* 209 */
/***/ (function(module, exports) {

module.exports = require("glob-intersection");

/***/ }),
/* 210 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const allowAuthenticated = __webpack_require__(211);
const asgs = __webpack_require__(212);
const deployAuthorizer = __webpack_require__(213);
const deployments = __webpack_require__(215);
const environments = __webpack_require__(217);
const environmentsSchedule = __webpack_require__(218);
const instances = __webpack_require__(219);
const loadBalancerSettings = __webpack_require__(221);
const packageUploadUrl = __webpack_require__(222);
const services = __webpack_require__(223);
const simple = __webpack_require__(224);
const toggleServiceStatus = __webpack_require__(225);
const upstreams = __webpack_require__(226);

const modules = {
  'allow-authenticated': allowAuthenticated,
  'asgs': asgs,
  'deploy-authorizer': deployAuthorizer,
  'deployments': deployments,
  'environments': environments,
  'environments-schedule': environmentsSchedule,
  'instances': instances,
  'load-balancer-settings': loadBalancerSettings,
  'package-upload-url': packageUploadUrl,
  'services': services,
  'simple': simple,
  'toggle-service-status': toggleServiceStatus,
  'upstreams': upstreams
};

module.exports = modules;


/***/ }),
/* 211 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



exports.getRules = () => Promise.resolve([]);

exports.docs = {
  requiresClusterPermissions: false,
  requiresEnvironmentTypePermissions: false
};


/***/ }),
/* 212 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let configEnvironments = __webpack_require__(18);

function getEnvironment(name) {
  return configEnvironments.get({ EnvironmentName: name });
}

function getModifyPermissionsForEnvironment(environmentName, user) {
  return getEnvironment(environmentName, user).then((environment) => {
    if (environment) {
      return {
        cluster: environment.Value.OwningCluster.toLowerCase(),
        environmentType: environment.Value.EnvironmentType.toLowerCase()
      };
    }
    throw new Error(`Could not find environment: ${environmentName}`);
  });
}

exports.getRules = (request) => {
  let r = /^(.*?)-/;
  let match = r.exec(request.params.name);

  if (match && match[1]) {
    return getModifyPermissionsForEnvironment(match[1], request.user).then(envPermissions => (
      [{
        resource: request.url.replace(/\/+$/, ''),
        access: request.method,
        clusters: [envPermissions.cluster],
        environmentTypes: [envPermissions.environmentType]
      }]
    ));
  }

  return Promise.resolve();
};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: true
};


/***/ }),
/* 213 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let BadRequestError = __webpack_require__(214);

let infrastructureConfigurationProvider = __webpack_require__(52);
let logger = __webpack_require__(2);
let Environment = __webpack_require__(9);
let co = __webpack_require__(0);

// Only deployments targeted to Secure subnet in Production require an additional permission
function isSecureServerRole(configuration) {
  if (configuration.serverRole.SecurityZone === 'Secure') return true;
  return false;
}

module.exports = {
  getRules(request) {
    return co(function* () {
      let environmentName = request.params.environment || request.body.environment;
      let serviceName = request.params.service || request.body.service;

      let environment = yield Environment.getByName(environmentName);
      let deploymentMap = yield environment.getDeploymentMap();
      let serverRoles = _.map(yield deploymentMap.getServerRolesByServiceName(serviceName), 'ServerRoleName');

      let serverRoleName;
      let inputServerRole = request.query.server_role || request.body.server_role || request.body.serverRole;
      if (inputServerRole) {
        serverRoleName = inputServerRole;
        if (serverRoles.indexOf(serverRoleName) === -1) {
          return Promise.reject(new BadRequestError(`"${serverRoleName}" is not a potential target for deploy of "${serviceName}", available roles: ${serverRoles.join(', ')}`));
        }
      } else if (serverRoles.length !== 1) {
        return Promise.reject(new BadRequestError(`"server_role" param required, available server roles for "${serviceName}": ${serverRoles.join(', ')}`));
      } else {
        serverRoleName = serverRoles[0];
      }

      // Attach serverRoles to request object
      request.serverRoleName = serverRoleName;

      let requiredPermissions = [];
      let requiredPermission = {
        resource: request.url.replace(/\/+$/, ''),
        access: request.method,
        clusters: [],
        environmentTypes: []
      };
      requiredPermissions.push(requiredPermission);

      return infrastructureConfigurationProvider
        .get(environmentName, serviceName, serverRoleName)
        .then((configuration) => {
          requiredPermission.clusters.push(configuration.cluster.Name.toLowerCase());

          requiredPermission.environmentTypes.push(configuration.environmentTypeName.toLowerCase());

          if (isSecureServerRole(configuration)) {
            requiredPermissions.push({
              resource: '/permissions/securityzones/secure',
              access: 'POST'
            });
          }

          return requiredPermissions;
        }).catch((error) => {
          logger.warn(error.toString(true));
          return Promise.reject(new BadRequestError(error.toString()));
        });
    });
  },

  docs: {
    requiresClusterPermissions: true,
    requiresEnvironmentTypePermissions: true,
    requiresSecurityZonePermissions: true
  }
};


/***/ }),
/* 214 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function BadRequestError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 215 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let deploymentsHelper = __webpack_require__(113);

module.exports = {
  getRules(request) {
    return co(function* () {
      let key = request.swagger.params.id.value;
      let deployment = yield deploymentsHelper.get({ key });

      return [{
        resource: request.url.replace(/\/+$/, ''),
        access: request.method,
        clusters: [deployment.Value.OwningCluster],
        environmentTypes: [deployment.Value.EnvironmentType]
      }];
    });
  }
};


/***/ }),
/* 216 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let deployments = __webpack_require__(35);

class Deployment {

  constructor(data, expectedNodes = undefined) {
    _.assign(this, data);
    if (expectedNodes !== undefined) {
      _.assign(this, { ExpectedNodes: expectedNodes });
    }
  }

  static getById(key) {
    return deployments.get({ DeploymentID: key });
  }
}

module.exports = Deployment;


/***/ }),
/* 217 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let configEnvironments = __webpack_require__(18);

function getCurrentEnvironment(name) {
  return configEnvironments.get({ EnvironmentName: name });
}

exports.getRules = (request) => {
  let requiredPermission = {
    resource: request.url.replace(/\/+$/, ''),
    access: request.method,
    clusters: [],
    environmentTypes: []
  };

  if (request.method === 'POST') {
    let newCluster = request.body.Value.OwningCluster;
    if (newCluster) {
      requiredPermission.clusters.push(newCluster.toLowerCase());
    }

    let environmentType = request.body.Value.EnvironmentType;
    if (environmentType) {
      requiredPermission.environmentTypes.push(environmentType.toLowerCase());
    }

    return Promise.resolve([requiredPermission]);
  }

  if (request.method === 'PUT') {
    // TODO: subsequent parameters are for v1 API.
    // Once old API is gone, should use request.swagger.params.
    let environmentType = request.body.EnvironmentType || request.body.Value.EnvironmentType;

    if (environmentType) {
      requiredPermission.environmentTypes.push(environmentType.toLowerCase());
    }
  }

  // TODO: subsequent parameters are for v1 API.
  // Once old API is gone, should use request.swagger.params.
  let environmentName = request.params.key || request.params.name || request.params.environment
    || _.get(request, 'swagger.params.environment.value');

  let user = request.user;

  return getCurrentEnvironment(environmentName, user).then((environment) => {
    if (environment) {
      requiredPermission.clusters.push(environment.Value.OwningCluster.toLowerCase());
      requiredPermission.environmentTypes.push(environment.Value.EnvironmentType.toLowerCase());
    }

    return [requiredPermission];
  });
};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: true
};


/***/ }),
/* 218 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let configEnvironments = __webpack_require__(18);
let environmentProtection = __webpack_require__(114);

const ACTION = environmentProtection.SCHEDULE_ENVIRONMENT;

function getCurrentEnvironment(name) {
  return configEnvironments.get({ EnvironmentName: name });
}

function* getRules(request) {
  let requiredPermission = {
    resource: request.url.replace(/\/+$/, ''),
    access: request.method
  };

  // Need to check 'name' because of swagger
  let environmentName = request.params.key || request.params.name;
  let user = request.user;
  let environment = yield getCurrentEnvironment(environmentName, user);
  let environmentTypeName = environment.Value.EnvironmentType.toLowerCase();
  if (environment) {
    requiredPermission.clusters = [environment.Value.OwningCluster.toLowerCase()];
    requiredPermission.environmentTypes = [environmentTypeName];
  }

  let isProtected = yield environmentProtection.isActionProtected(environmentName, ACTION);
  if (isProtected) {
    requiredPermission.protectedAction = ACTION;
  }

  return [requiredPermission];
}

module.exports = {
  getRules: co.wrap(getRules),
  docs: {
    requiresClusterPermissions: true,
    requiresEnvironmentTypePermissions: true
  }
};


/***/ }),
/* 219 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let Instance = __webpack_require__(60);
let co = __webpack_require__(0);

exports.getRules = function getRules(request) {
  const id = request.swagger.params.id.value;

  return co(function* _() {
    const instance = yield Instance.getById(id);
    const owningCluster = instance.getTag('OwningCluster');

    return [{
      resource: request.url.replace(/\/+$/, ''),
      access: request.method,
      clusters: [owningCluster]
    }];
  });
};


/***/ }),
/* 220 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function InstanceNotFoundError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 221 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let configEnvironments = __webpack_require__(18);

function getEnvironment(name) {
  return configEnvironments.get({ EnvironmentName: name });
}

function getModifyPermissionsForEnvironment(environmentName, user) {
  return getEnvironment(environmentName, user).then((environment) => {
    if (environment) {
      return {
        cluster: environment.Value.OwningCluster.toLowerCase(),
        environmentType: environment.Value.EnvironmentType.toLowerCase()
      };
    }

    throw new Error(`Could not find environment: ${environmentName}`);
  });
}

exports.getRules = (request) => {
  let environmentName = request.params.key || request.params.environment;
  if (environmentName === undefined) {
    // Environment is in the body
    let body = request.params.body || request.body;
    environmentName = body.EnvironmentName || body.Value.EnvironmentName;
  }
  return getModifyPermissionsForEnvironment(environmentName, request.user).then(envPermissions => [{
    resource: request.url.replace(/\/+$/, ''),
    access: request.method,
    clusters: [envPermissions.cluster],
    environmentTypes: [envPermissions.environmentType]
  }]);
};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: true
};


/***/ }),
/* 222 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let Environment = __webpack_require__(9);
let Service = __webpack_require__(116);

let fp = __webpack_require__(4);

let param = p => fp.get(['swagger', 'params', p, 'value']);

function getRules(request) {
  let resource = request.url.replace(/\/+$/, '');
  let access = request.method;
  let environment = param('environment')(request);
  let service = param('service')(request);

  if (environment !== undefined) {
    return Environment.getByName(environment).then(env => ({
      resource,
      access,
      clusters: [env.OwningCluster],
      environmentTypes: [env.EnvironmentType] }));
  } else {
    return Service.getByName(service).then(svc => ({
      resource,
      access,
      clusters: [svc.OwningCluster] }));
  }
}

module.exports = {
  docs: {
    requiresClusterPermissions: true,
    requiresEnvironmentTypePermissions: true
  },
  getRules
};


/***/ }),
/* 223 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



exports.getRules = (request) => {
  let body = request.params.body || request.body;
  let cluster = request.params.range || request.params.cluster || body.OwningCluster;

  return Promise.resolve([{
    resource: request.url.replace(/\/+$/, ''),
    access: request.method,
    clusters: [cluster.toLowerCase()]
  }]);
};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: false
};


/***/ }),
/* 224 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



exports.getRules = request => Promise.resolve([{
  resource: request.url.replace(/\/+$/, ''),
  access: request.method
}]);

exports.docs = {
  requiresClusterPermissions: false,
  requiresEnvironmentTypePermissions: false
};


/***/ }),
/* 225 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let environments = __webpack_require__(18);
let services = __webpack_require__(28);

module.exports = {
  getRules(request) {
    return co(function* () {
      let environmentName = request.swagger.params.environment.value;
      let environment = yield environments.get({ EnvironmentName: environmentName });

      let serviceName = request.swagger.params.service.value;
      let service = yield services.get({ ServiceName: serviceName });

      return [{
        resource: request.url.replace(/\/+$/, ''),
        access: request.method,
        clusters: [service.OwningCluster],
        environmentTypes: [environment.Value.EnvironmentType]
      }];
    });
  }
};


/***/ }),
/* 226 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let configEnvironments = __webpack_require__(18);
let loadBalancerUpstreams = __webpack_require__(38);
let Environment = __webpack_require__(9);
let logger = __webpack_require__(2);

function getUpstream(upstreamName) {
  return loadBalancerUpstreams.get({ Key: upstreamName });
}

function getEnvironment(name) {
  return configEnvironments.get({ EnvironmentName: name });
}

function getModifyPermissionsForEnvironment(environmentName) {
  return getEnvironment(environmentName).then(environment => ({
    cluster: environment.Value.OwningCluster.toLowerCase(),
    environmentType: environment.Value.EnvironmentType.toLowerCase()
  }));
}

function getEnvironmentPermissionsPromise(upstreamName, environmentName, accountName, method) {
  if (method === 'POST') {
    return getModifyPermissionsForEnvironment(environmentName);
  }

  return getUpstream(upstreamName)
    .then((upstream) => {
      if (upstream) {
        let envName = upstream.Environment;
        return getModifyPermissionsForEnvironment(envName);
      }

      throw new Error(`Could not find upstream: ${upstreamName}`);
    });
}

exports.getRules = (request) => {
  let r = /^\/(.*)\/config$/;
  let upstreamName = request.params.key || request.params.name || request.params.body.key;
  let accountName = request.params.account;

  return co(function* () {
    let body = request.params.body || request.body;
    logger.debug('Upstreams authorizer', { body, url: request.url });
    let environmentName = upstreamName.substr(1, 3);

    if (accountName === undefined) {
      accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    }

    let match = r.exec(upstreamName);
    let path = `/${request.params.account}/config/lbUpstream/${match[1]}`;
    let getEnvironmentPermissions = getEnvironmentPermissionsPromise(upstreamName, environmentName, accountName, request.method);

    return getEnvironmentPermissions.then(envPermissions => [{
      resource: path,
      access: request.method,
      clusters: [envPermissions.cluster],
      environmentTypes: [envPermissions.environmentType]
    }]);
  });
};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: true
};


/***/ }),
/* 227 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const path = __webpack_require__(40);
const apiSpec = __webpack_require__(117);
const API_BASE_PATH = apiSpec.basePath;
const isNewRelicInUse = __webpack_require__(229);

function newRelicSwaggerMiddleware(req, res, next) {
  let newrelic = __webpack_require__(87); // eslint-disable-line global-require
  newrelic.setTransactionName(path.join(API_BASE_PATH, req.path));
  next();
}

function newRelicSwaggerMiddlewareNoOp(req, res, next) {
  next();
}

const swaggerNewRelic = isNewRelicInUse() ? newRelicSwaggerMiddleware : newRelicSwaggerMiddlewareNoOp;

module.exports = swaggerNewRelic;


/***/ }),
/* 228 */
/***/ (function(module, exports) {

module.exports = require("js-yaml");

/***/ }),
/* 229 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



module.exports = () => process.env.NEW_RELIC_APP_NAME !== undefined;


/***/ }),
/* 230 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const IS_PROD = __webpack_require__(5).get('IS_PRODUCTION');
let _ = __webpack_require__(1);

function defaultErrorHandler(err, req, res, next) {
  try {
    let friendlyError = {};
    if (res.statusCode >= 400 && res.statusCode < 500) {
      try {
        friendlyError.error = err.message;
        friendlyError.details = _.map(_.get(err, 'results.errors'), error => `${error.path}: ${error.message}`);
      } catch (error) {
        friendlyError = err;
      }
    } else {
      if (res.statusCode === 200) {
        res.status(getStatusByErrorType(err));
      }
      friendlyError.error = err.message;
    }

    friendlyError.originalException = err;

    if (IS_PROD && res.statusCode === 500) {
      friendlyError = {
        error: 'An internal error has occurred.'
      };
    } else if (res.statusCode === 409) {
      friendlyError = {
        error: 'The item you are attempting to update has already been modified. Check your expected-version.'
      };
    }

    res.json(friendlyError);
  } catch (error) {
    next(error);
  }
}

function getStatusByErrorType(error) {
  switch (error.name) {
    case 'AutoScalingGroupNotFoundError':
    case 'ImageNotFoundError':
    case 'InstanceNotFoundError':
    case 'InstanceProfileNotFoundError':
    case 'ResourceNotFoundError':
    case 'RoleNotFoundError':
    case 'SecurityGroupNotFoundError':
    case 'TopicNotFoundError':
    case 'DynamoItemNotFoundError': return 404;
    case 'ResourceLockedError': return 423;
    case 'EvalError':
    case 'InternalError':
    case 'RangeError':
    case 'ReferenceError':
    case 'SyntaxError':
    case 'TypeError':
    case 'URIError':
    case 'AssertionError': return 500;

    default: return 400;
  }
}

module.exports = defaultErrorHandler;


/***/ }),
/* 231 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const asgController = __webpack_require__(232);
const auditController = __webpack_require__(257);
const accountsController = __webpack_require__(262);
const clusterController = __webpack_require__(264);
const deploymentMapController = __webpack_require__(265);
const environmentTypeController = __webpack_require__(266);
const environmentsConfigController = __webpack_require__(267);
const exportController = __webpack_require__(268);
const importController = __webpack_require__(269);
const lbSettingsController = __webpack_require__(271);
const notificationSettingsController = __webpack_require__(273);
const permissionsController = __webpack_require__(275);
const serverRoleController = __webpack_require__(276);
const servicesConfigController = __webpack_require__(277);
const upstreamsConfigController = __webpack_require__(278);
const deploymentsController = __webpack_require__(282);
const diagnosticsController = __webpack_require__(327);
const environmentsController = __webpack_require__(328);
const imagesController = __webpack_require__(337);
const instancesController = __webpack_require__(339);
const loadBalancerController = __webpack_require__(345);
const dynamicResponseCreator = __webpack_require__(139);
const packageUploadUrlController = __webpack_require__(348);
const servicesController = __webpack_require__(352);
const targetStateController = __webpack_require__(360);
const tokenController = __webpack_require__(362);
const upstreamsController = __webpack_require__(364);
const userController = __webpack_require__(367);

function getFunctions(obj) {
  return Object.keys(obj)
    .map(k => [k, obj[k]])
    .filter(([, v]) => typeof v === 'function');
}

const controllerModules = {
  asgController,
  auditController,
  accountsController,
  clusterController,
  deploymentMapController,
  environmentTypeController,
  environmentsConfigController,
  exportController,
  importController,
  lbSettingsController,
  notificationSettingsController,
  permissionsController,
  serverRoleController,
  servicesConfigController,
  upstreamsConfigController,
  deploymentsController,
  diagnosticsController,
  environmentsController,
  imagesController,
  instancesController,
  loadBalancerController,
  dynamicResponseCreator,
  packageUploadUrlController,
  servicesController,
  targetStateController,
  tokenController,
  upstreamsController,
  userController
};

function controllers() {
  return Object.keys(controllerModules)
    .map(k => [k, controllerModules[k]])
    .map(([moduleName, $module]) => {
      return getFunctions($module).reduce((acc, [memberName, fun]) => Object.assign(acc, { [`${moduleName}_${memberName}`]: fun }), {});
    })
    .reduce((acc, nxt) => Object.assign(acc, nxt), {});
}
module.exports = controllers;


/***/ }),
/* 232 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let Promise = __webpack_require__(10);
let co = __webpack_require__(0);
let getAllASGs = __webpack_require__(233);
let getAccountASGs = __webpack_require__(61);
let getASG = __webpack_require__(56);
let AutoScalingGroup = __webpack_require__(19);
let asgips = __webpack_require__(118);
let GetLaunchConfiguration = __webpack_require__(235);
let SetLaunchConfiguration = __webpack_require__(240);
let SetAutoScalingGroupSize = __webpack_require__(82);
let SetAutoScalingGroupSchedule = __webpack_require__(244);
let UpdateAutoScalingGroup = __webpack_require__(245);
let GetAutoScalingGroupScheduledActions = __webpack_require__(246);
let GetAutoScalingGroupLifeCycleHooks = __webpack_require__(249);
let getASGReady = __webpack_require__(252);
let Environment = __webpack_require__(9);
let sns = __webpack_require__(12);
let opsEnvironment = __webpack_require__(45);

class ValidationError extends Error {
  constructor(obj) {
    super();
    Object.assign(this, obj);
  }
}

function checkEnvironmentExists(environmentName) {
  return environment => (environment
    ? Promise.resolve(environment)
    : Promise.reject(new ValidationError({
      errors: [
        { title: 'Environment Not Found', detail: `environment name: ${environmentName}` }
      ],
      status: 400
    })));
}

function checkEnvironmentUnlocked(environment) {
  return Promise.resolve()
    .then(() => {
      let { EnvironmentName, Value: { DeploymentsLocked = false } = {} } = environment || {};
      return DeploymentsLocked
        ? Promise.reject(new ValidationError({
          errors: [
            { title: 'Environment Locked', detail: `environment name: ${EnvironmentName}` }
          ],
          status: 400
        }))
        : Promise.resolve(environment);
    });
}

function handleValidationErrors(res) {
  return error => (error instanceof ValidationError
    ? res.status(error.status || 400).json({ errors: error.errors })
    : Promise.reject(error));
}

/**
 * GET /asgs
 */
function getAsgs(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const environment = req.swagger.params.environment.value;

  return co(function* () {
    let list;
    if (environment !== undefined) {
      let account = yield Environment.getAccountNameForEnvironment(environment);
      let t = yield getAccountASGs({
        accountName: account
      });
      list = t.filter(asg => asg.getTag('Environment') === environment);
    } else if (accountName !== undefined) {
      list = yield getAccountASGs({
        accountName
      });
    } else {
      list = yield getAllASGs();
    }

    res.json(list);
  }).catch(next);
}

/**
 * GET /asgs/{name}
 */
function getAsgByName(req, res, next) {
  const autoScalingGroupName = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;

  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    let lifecycleHooks = yield GetAutoScalingGroupLifeCycleHooks({ accountName, autoScalingGroupName });
    return getASG({ accountName, autoScalingGroupName }).then((data) => {
      res.json(Object.assign({}, data, { LifecycleHooks: lifecycleHooks }));
    });
  }).catch(next);
}


/**
 * GET /asgs/{name}/ready
 */
function getAsgReadyByName(req, res, next) {
  const autoScalingGroupName = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;

  return getASGReady({
    autoScalingGroupName,
    environmentName
  })
    .then(data => res.json(data)).catch(next);
}


/**
 * GET /asgs/{name}/ips
 */
function getAsgIps(req, res, next) {
  const key = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;
  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    asgips.get(accountName, { AsgName: key }).then(data => res.json(data));
  }).catch(next);
}

/**
 * GET /asgs/{name}/launch-config
 */
function getAsgLaunchConfig(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    GetLaunchConfiguration({ accountName, autoScalingGroupName }).then(data => res.json(data));
  }).catch(next);
}

/**
 * GET /asgs/{name}/scaling-schedule
 */
function getScalingSchedule(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    GetAutoScalingGroupScheduledActions({ accountName, autoScalingGroupName }).then(data => res.json(data));
  }).catch(next);
}

/**
 * PUT /asgs/{name}
 */
function putAsg(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;
  const parameters = req.swagger.params.body.value;

  return opsEnvironment.get({ EnvironmentName: environmentName })
    .then(checkEnvironmentExists(environmentName))
    .then(checkEnvironmentUnlocked)
    .then(() => UpdateAutoScalingGroup({
      environmentName,
      autoScalingGroupName,
      parameters
    }))
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/asgs/${autoScalingGroupName}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: autoScalingGroupName
      }
    }))
    .catch(handleValidationErrors(res))
    .catch(next);
}

/**
 * DELETE /asgs/{name}
 */
function deleteAsg(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return opsEnvironment.get({ EnvironmentName: environmentName })
    .then(checkEnvironmentExists(environmentName))
    .then(checkEnvironmentUnlocked)
    .then(() => Environment.getAccountNameForEnvironment(environmentName))
    .then(accountName => AutoScalingGroup.getByName(accountName, autoScalingGroupName))
    .then(asg => asg.deleteASG())
    .then((status) => { res.json({ Ok: status }); })
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/asgs/${autoScalingGroupName}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.DELETE,
        ID: autoScalingGroupName
      }
    }))
    .catch(handleValidationErrors(res))
    .catch(next);
}

/**
 * PUT /asgs/{name}/scaling-schedule
 */
function putScalingSchedule(req, res, next) {
  const { propagateToInstances, schedule } = req.swagger.params.body.value;
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return opsEnvironment.get({ EnvironmentName: environmentName })
    .then(checkEnvironmentExists(environmentName))
    .then(checkEnvironmentUnlocked)
    .then(() => Environment.getAccountNameForEnvironment(environmentName))
    .then(accountName => SetAutoScalingGroupSchedule({
      accountName,
      autoScalingGroupName,
      schedule,
      propagateToInstances
    }))
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/asgs/${autoScalingGroupName}/scaling-schedule`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: autoScalingGroupName
      }
    }))
    .catch(handleValidationErrors(res))
    .catch(next);
}

/**
 * PUT /asgs/{name}/size
 */
function putAsgSize(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;
  const body = req.swagger.params.body.value;
  const autoScalingGroupMinSize = body.min;
  const autoScalingGroupDesiredSize = body.desired;
  const autoScalingGroupMaxSize = body.max;

  return opsEnvironment.get({ EnvironmentName: environmentName })
    .then(checkEnvironmentExists(environmentName))
    .then(checkEnvironmentUnlocked)
    .then(() => Environment.getAccountNameForEnvironment(environmentName))
    .then(accountName => SetAutoScalingGroupSize({
      accountName,
      autoScalingGroupName,
      autoScalingGroupMinSize,
      autoScalingGroupDesiredSize,
      autoScalingGroupMaxSize
    }))
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/asgs/${autoScalingGroupName}/size`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: autoScalingGroupName
      }
    }))
    .catch(handleValidationErrors(res))
    .catch(next);
}

/**
 * PUT /asgs/{name}/launch-config
 */
function putAsgLaunchConfig(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const data = req.swagger.params.body.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return opsEnvironment.get({ EnvironmentName: environmentName })
    .then(checkEnvironmentExists(environmentName))
    .then(checkEnvironmentUnlocked)
    .then(() => Environment.getAccountNameForEnvironment(environmentName))
    .then(accountName => SetLaunchConfiguration({
      accountName,
      autoScalingGroupName,
      data
    }))
    .then(x => res.json(x))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/asgs/${autoScalingGroupName}/launch-config`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: autoScalingGroupName
      }
    }))
    .catch(handleValidationErrors(res))
    .catch(next);
}

module.exports = {
  getAsgs,
  getAsgByName,
  getAsgReadyByName,
  getAsgIps,
  getAsgLaunchConfig,
  putScalingSchedule,
  getScalingSchedule,
  deleteAsg,
  putAsg,
  putAsgSize,
  putAsgLaunchConfig
};


/***/ }),
/* 233 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let scanCrossAccount = __webpack_require__(234);
let ScanAutoScalingGroups = __webpack_require__(61);

module.exports = function ScanCrossAccountAutoScalingGroups(query) {
  return scanCrossAccount(ScanAutoScalingGroups, query, 'ScanAutoScalingGroups');
};


/***/ }),
/* 234 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let sender = __webpack_require__(6);
let scanCrossAccountFn = __webpack_require__(80);

function scanCrossAccount(query, simpleScanQueryName) {
  function queryAccount(account) {
    let childQuery = Object.assign({ name: simpleScanQueryName, accountName: account.AccountName }, query);
    return sender.sendQuery({ query: childQuery, parent: query });
  }
  return scanCrossAccountFn(queryAccount);
}

module.exports = scanCrossAccount;


/***/ }),
/* 235 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let AutoScalingGroup = __webpack_require__(19);
let instanceDevicesProvider = __webpack_require__(81);
let Image = __webpack_require__(236);
let SecurityGroup = __webpack_require__(119);

let _ = __webpack_require__(1);

module.exports = function GetLaunchConfiguration(query) {
  let accountName = query.accountName;
  let autoScalingGroupName = query.autoScalingGroupName;

  return co(function* () {
    let autoScalingGroup = yield AutoScalingGroup.getByName(accountName, autoScalingGroupName);
    let awsLaunchConfig = yield autoScalingGroup.getLaunchConfiguration();

    let Volumes = instanceDevicesProvider.fromAWS(awsLaunchConfig.BlockDeviceMappings);

    let image = yield Image.getById(awsLaunchConfig.ImageId);

    let environmentType = yield autoScalingGroup.getEnvironmentType();
    let vpcId = environmentType.VpcId;

    let securityGroups = yield SecurityGroup.getAllByIds(accountName, vpcId, awsLaunchConfig.SecurityGroups);
    let securityGroupsNames = _.map(securityGroups, group => group.getTag('Name'));

    let ret = {
      ImageId: image.ImageId,
      AMI: image.Name, // TODO: find AMI
      InstanceProfileName: awsLaunchConfig.IamInstanceProfile,
      InstanceType: awsLaunchConfig.InstanceType,
      SecurityGroups: securityGroupsNames,
      Volumes,
      UserData: new Buffer(awsLaunchConfig.UserData, 'base64').toString('ascii')
    };

    return ret;
  });
};



/***/ }),
/* 236 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let sender = __webpack_require__(6);
let co = __webpack_require__(0);
let ScanCrossAccountImages = __webpack_require__(53);

class Image {

  constructor(data) {
    _.assign(this, data);
  }

  static getById(id) {
    return co(function* () {
      let images = yield sender.sendQuery(ScanCrossAccountImages, {
        query: {
          name: 'ScanCrossAccountImages'
        }
      });
      let image = _.find(images, { ImageId: id });
      return new Image(image);
    });
    // let image = yield imageProvider.get(awsLaunchConfig.ImageId);
  }

}

module.exports = Image;


/***/ }),
/* 237 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const securityGroupResourceFactory = __webpack_require__(238);

module.exports = function ScanSecurityGroupsQueryHandler(query) {
  let parameters = { accountName: query.accountName };

  return securityGroupResourceFactory.create(undefined, parameters).then((resource) => {
    let request = {
      vpcId: query.vpcId,
      groupIds: query.groupIds,
      groupNames: query.groupNames
    };

    return resource.scan(request);
  });
};


/***/ }),
/* 238 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let amazonClientFactory = __webpack_require__(14);
let SecurityGroupResource = __webpack_require__(239);

module.exports = {

  canCreate: resourceDescriptor =>
    resourceDescriptor.type.toLowerCase() === 'ec2/sg',

  create: (resourceDescriptor, parameters) =>
    amazonClientFactory.createEC2Client(parameters.accountName).then(client => new SecurityGroupResource(client))

};


/***/ }),
/* 239 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



function createRequest(parameters) {
  if (!parameters) return {};

  let request = {
    Filters: [
      { Name: 'vpc-id', Values: [parameters.vpcId] }
    ]
  };

  if (parameters.groupIds) {
    request.Filters.push({ Name: 'group-id', Values: parameters.groupIds });
  }

  if (parameters.groupNames) {
    request.Filters.push({ Name: 'tag-key', Values: ['Name'] });
    request.Filters.push({ Name: 'tag-value', Values: parameters.groupNames });
  }

  return request;
}

function SecurityGroupResource(client) {
  this.scan = function (parameters) {
    let request = createRequest(parameters);
    return client.describeSecurityGroups(request).promise().then(response => response.SecurityGroups);
  };
}

module.exports = SecurityGroupResource;


/***/ }),
/* 240 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let launchConfigUpdater = __webpack_require__(241);
let co = __webpack_require__(0);
let sender = __webpack_require__(6);
let logger = __webpack_require__(2);
let _ = __webpack_require__(1);

let imageProvider = __webpack_require__(74);
let instanceDevicesProvider = __webpack_require__(81);
let securityGroupsProvider = __webpack_require__(120);

let AutoScalingGroup = __webpack_require__(19);
let GetInstanceProfile = __webpack_require__(121);

module.exports = function SetLaunchConfiguration(command) {
  return co(function* () {
    let data = command.data;
    let updated = {};
    let autoScalingGroup = yield AutoScalingGroup.getByName(command.accountName, command.autoScalingGroupName);
    let originalLaunchConfiguration = yield autoScalingGroup.getLaunchConfiguration();

    // Get the image and disk size specified
    let image = yield imageProvider.get(data.AMI || originalLaunchConfiguration.ImageId);
    let osDiskSize = getOSDiskSize(data.Volumes, originalLaunchConfiguration.BlockDeviceMappings);

    // Check the OS disk size supports that image
    if (osDiskSize < image.rootVolumeSize) {
      throw new Error(`The specified OS volume size (${osDiskSize} GB) is not sufficient for image '${image.name}' (${image.rootVolumeSize} GB)`);
    }

    let environmentType = yield autoScalingGroup.getEnvironmentType();
    let vpcId = environmentType.VpcId;

    if (data.InstanceProfileName !== undefined) {
      // That's checking if this instance profile name exists
      yield getInstanceProfileByName(command.accountName, data.InstanceProfileName);
      updated.IamInstanceProfile = data.InstanceProfileName;
    }

    if (data.InstanceType !== undefined) {
      updated.InstanceType = data.InstanceType;
    }

    if (data.Volumes !== undefined) {
      updated.BlockDeviceMappings = instanceDevicesProvider.toAWS(data.Volumes);
    }

    if (data.SecurityGroups !== undefined) {
      let securityGroupsNamesAndReasons = _.map(data.SecurityGroups, name => ({
        name,
        reason: 'It was set by user in LaunchConfig form'
      }));
      let securityGroups = yield securityGroupsProvider.getFromSecurityGroupNames(command.accountName, vpcId, securityGroupsNamesAndReasons, logger);
      updated.SecurityGroups = _.map(securityGroups, 'GroupId');
    }

    if (data.AMI !== undefined) {
      updated.ImageId = image.id;
    }

    if (data.UserData !== undefined) {
      updated.UserData = new Buffer(data.UserData).toString('base64');
    }

    let accountName = command.accountName;
    let autoScalingGroupName = command.autoScalingGroupName;

    logger.debug(`Updating ASG ${autoScalingGroupName} with: ${JSON.stringify(updated)}`);

    return launchConfigUpdater.set(
      accountName,
      autoScalingGroup,
      (launchConfiguration) => {
        _.assign(launchConfiguration, updated);
      }
    );
  });
};

function getOSDiskSize(newVolumes, originalBlockDeviceMappings) {
  if (newVolumes !== undefined) {
    let newOSVolume = _.find(newVolumes, v => v.Name === 'OS');
    return newOSVolume.Size;
  }

  let originalOSBlockDeviceMapping = _.find(originalBlockDeviceMappings, d => _.includes(['/dev/sda1', '/dev/xvda'], d.DeviceName));
  return originalOSBlockDeviceMapping.Ebs.VolumeSize;
}

function getInstanceProfileByName(accountName, instanceProfileName) {
  let query = {
    name: 'GetInstanceProfile',
    accountName,
    instanceProfileName
  };

  return sender.sendQuery(GetInstanceProfile, { query });
}


/***/ }),
/* 241 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
const asgResourceFactory = __webpack_require__(25);
const launchConfigurationResourceFactory = __webpack_require__(58);

module.exports = {
  //
  set(accountName, autoScalingGroup, updateAction) {
    return co(function* () {
      // Obtain an object containing resource instances to work with
      // LaunchConfigurations and AutoScalingGroups
      //
      let autoScalingGroupName = autoScalingGroup.$autoScalingGroupName;

      let launchConfigurationClient = yield launchConfigurationResourceFactory.create(undefined, { accountName });
      let autoScalingGroupClient = yield asgResourceFactory.create(undefined, { accountName });

      // Send a request to obtain the LaunchConfiguration for the specific
      // AutoScalingGroup
      // [AutoScalingGroup] <---> [LaunchConfiguration]
      //
      let originalLaunchConfiguration = yield autoScalingGroup.getLaunchConfiguration();

      // Clone the original LaunchConfiguration creating a backup version
      // [AutoScalingGroup] <---> [LaunchConfiguration]
      //                          [LaunchConfiguration_Backup] (creating ...)

      let backupLaunchConfiguration = Object.assign({}, originalLaunchConfiguration);
      backupLaunchConfiguration.LaunchConfigurationName += '_Backup';

      yield launchConfigurationClient.post(backupLaunchConfiguration);

      // Attach the backup LaunchConfiguration just created to the target AutoScalingGroup
      //                          [LaunchConfiguration]
      // [AutoScalingGroup] <---> [LaunchConfiguration_Backup]

      yield attachLaunchConfigurationToAutoScalingGroup(
        autoScalingGroupClient, autoScalingGroupName, backupLaunchConfiguration
      );

      // Delete the original LaunchConfiguration (a LaunchConfiguration cannot be
      // changed. Only way is delete it and create it again).
      //                          [LaunchConfiguration] (deleting...)
      // [AutoScalingGroup] <---> [LaunchConfiguration_Backup]

      yield launchConfigurationClient.delete({ name: originalLaunchConfiguration.LaunchConfigurationName });

      // Create a new LaunchConfiguration starting from the original applying an
      // updateAction function on it.
      //                          [LaunchConfiguration] (creating ...)
      // [AutoScalingGroup] <---> [LaunchConfiguration_Backup]

      let updatedLaunchConfiguration = Object.assign({}, originalLaunchConfiguration);
      updateAction(updatedLaunchConfiguration);

      yield launchConfigurationClient.post(updatedLaunchConfiguration);

      // Attach new LaunchConfiguration to the target AutoScalingGroup.
      // NOTE: this LaunchConfiguration is equal to the original one but updated.
      // [AutoScalingGroup] <---> [LaunchConfiguration]
      //                          [LaunchConfiguration_Backup]

      yield attachLaunchConfigurationToAutoScalingGroup(
        autoScalingGroupClient, autoScalingGroupName, updatedLaunchConfiguration
      );

      // Delete the backup LaunchConfiguration as no longer needed.
      // [AutoScalingGroup] <---> [LaunchConfiguration]
      //                          [LaunchConfiguration_Backup] (deleting...)
      yield launchConfigurationClient.delete({ name: backupLaunchConfiguration.LaunchConfigurationName });
    });
  }
};

function attachLaunchConfigurationToAutoScalingGroup(autoScalingGroupClient, autoScalingGroupName, launchConfiguration) {
  let parameters = {
    name: autoScalingGroupName,
    launchConfigurationName: launchConfiguration.LaunchConfigurationName
  };

  return autoScalingGroupClient.put(parameters);
}


/***/ }),
/* 242 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let amazonClientFactory = __webpack_require__(14);

let AwsError = __webpack_require__(33);
let InstanceProfileNotFoundError = __webpack_require__(243);
let assert = __webpack_require__(3);

function InstanceProfileResource(client) {
  this.client = client;

  this.get = function (parameters) {
    assert(parameters.instanceProfileName);

    let request = {
      InstanceProfileName: parameters.instanceProfileName
    };

    return client.getInstanceProfile(request).promise()
      .then(response => response.InstanceProfile)
      .catch((error) => {
        throw prettifyError(error, request);
      });
  };

  function prettifyError(error, request) {
    if (error.code === 'NoSuchEntity') {
      return new InstanceProfileNotFoundError(`Instance profile "${request.InstanceProfileName}" not found.`);
    } else {
      return new AwsError(`An error has occurred getting Iam instance profile: ${error.message}`);
    }
  }
}

module.exports = {
  canCreate: resourceDescriptor =>
    resourceDescriptor.type.toLowerCase() === 'iam/instanceprofiles',

  create: (resourceDescriptor, parameters) =>
    amazonClientFactory.createIAMClient(parameters.accountName).then(client => new InstanceProfileResource(client))

};


/***/ }),
/* 243 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function InstanceProfileNotFoundError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 244 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let co = __webpack_require__(0);
let autoScalingGroupClientFactory = __webpack_require__(25);

// TODO: Check redundant escapes in regex (eslint no-useless-escape)
let SCHEDULE_PATTERN = /^(NOSCHEDULE\s+)?((247|OFF|on|on6)|(((Start|Stop): [\d\,\-\*\\]+ [\d\,\-\*\\]+ [\d\,\-\*\\\w]+ [\d\,\-\*\\\w]+ [\d\,\-\*\\\w]+\s?[\d\,\-\*]*)(\s*\;?\s+|$))+)?(\s*NOSCHEDULE)?(\s*|.*)?$/i;
let InvalidOperationError = __webpack_require__(62);
let ec2InstanceClientFactory = __webpack_require__(83);
let AutoScalingGroup = __webpack_require__(19);

module.exports = function SetAutoScalingGroupScheduleCommandHandler(command) {
  return co(function* () {
    let schedule = command.schedule;
    let accountName = command.accountName;
    let autoScalingGroupName = command.autoScalingGroupName;
    let propagateToInstances = command.propagateToInstances;

    let scalingSchedule;
    if (_.isArray(command.schedule)) {
      scalingSchedule = command.schedule;
      schedule = 'NOSCHEDULE';
    } else {
      scalingSchedule = [];
      schedule = command.schedule;
    }

    if (!SCHEDULE_PATTERN.exec(schedule)) {
      return Promise.reject(new InvalidOperationError(
        `Provided schedule is invalid. Current value: "${schedule}".`
      ));
    }

    let result = {
      ChangedAutoScalingGroups: undefined,
      ChangedInstances: undefined
    };

    result.ChangedAutoScalingGroups = yield setAutoScalingGroupSchedule(
      autoScalingGroupName,
      schedule,
      scalingSchedule,
      accountName
    );

    if (propagateToInstances) {
      let autoScalingGroup = yield AutoScalingGroup.getByName(accountName, autoScalingGroupName);
      let instanceIds = autoScalingGroup.Instances.map(instance => instance.InstanceId);

      result.ChangedInstances = yield setEC2InstancesScheduleTag(
        instanceIds,
        schedule,
        accountName
      );
    }

    return result;
  });
};

function setAutoScalingGroupSchedule(autoScalingGroupName, schedule, scalingSchedule, accountName) {
  return autoScalingGroupClientFactory.create(undefined, { accountName }).then((client) => {
    let setScheduleTask = setAutoScalingGroupScalingSchedule(client, autoScalingGroupName, scalingSchedule, accountName);
    let setTagsTask = setAutoScalingGroupScheduleTag(client, autoScalingGroupName, schedule, accountName);

    return Promise
      .all([setScheduleTask, setTagsTask])
      .then(() => [autoScalingGroupName]);
  });
}

function setAutoScalingGroupScheduleTag(client, autoScalingGroupName, schedule) {
  let parameters = {
    name: autoScalingGroupName,
    tagKey: 'Schedule',
    tagValue: schedule
  };

  return client.setTag(parameters);
}

function setAutoScalingGroupScalingSchedule(client, autoScalingGroupName, newScheduledActions) {
  let defaultIfNil = (def, obj) => (obj !== null && obj !== undefined ? obj : def);
  return co(function* () {
    let existingScheduledActions = yield getScheduledActions(client, autoScalingGroupName);
    yield existingScheduledActions.map(action => deleteScheduledAction(client, action));

    if (!(newScheduledActions instanceof Array)) return Promise.resolve();

    return yield newScheduledActions.map((action, index) => {
      let desiredCapacityIfNil = defaultIfNil.bind(null, action.DesiredCapacity);
      let namedAction = {
        AutoScalingGroupName: autoScalingGroupName,
        ScheduledActionName: `EM-Scheduled-Action-${index + 1}`,
        MinSize: desiredCapacityIfNil(action.MinSize),
        MaxSize: desiredCapacityIfNil(action.MaxSize),
        DesiredCapacity: action.DesiredCapacity,
        Recurrence: action.Recurrence
      };
      return client.createScheduledAction(namedAction);
    });
  });
}

function getScheduledActions(client, autoScalingGroupName) {
  let parameters = {
    AutoScalingGroupName: autoScalingGroupName
  };
  return client.describeScheduledActions(parameters);
}

function deleteScheduledAction(client, action) {
  let parameters = {
    AutoScalingGroupName: action.AutoScalingGroupName,
    ScheduledActionName: action.ScheduledActionName
  };
  return client.deleteScheduledAction(parameters);
}

function setEC2InstancesScheduleTag(instanceIds, schedule, accountName) {
  if (!instanceIds.length) return Promise.resolve();
  return ec2InstanceClientFactory.create(undefined, { accountName }).then((client) => {
    let parameters = {
      instanceIds,
      tagKey: 'Schedule',
      tagValue: schedule
    };

    return client.setTag(parameters).then(() => instanceIds);
  });
}


/***/ }),
/* 245 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let _ = __webpack_require__(1);
let InvalidOperationError = __webpack_require__(62);
let subnetsProvider = __webpack_require__(122);
let Environment = __webpack_require__(9);
let EnvironmentType = __webpack_require__(43);
const asgResourceFactory = __webpack_require__(25);

function* handler(command) {
  // Validation
  let size = command.parameters.size;

  if (!_.isNil(size.min)) {
    if (!_.isNil(size.max) && size.min > size.max) {
      throw new InvalidOperationError(
        `Provided Max size '${size.max}' must be greater than or equal to the Min size '${size.min}'.`
      );
    }

    if (!_.isNil(size.desired) && size.desired < size.min) {
      throw new InvalidOperationError(
        `Provided Desired size '${size.desired}' must be greater than or equal to the Min size '${size.min}'.`
      );
    }
  }

  if (!_.isNil(size.max)) {
    if (!_.isNil(size.min) && size.min > size.max) {
      throw new InvalidOperationError(
        `Provided Min size '${size.min}' must be less than or equal to the Max size '${size.max}'.`
      );
    }

    if (!_.isNil(size.desired) && size.desired > size.max) {
      throw new InvalidOperationError(
        `Provided Desired size '${size.desired}' must be less than or equal to the Max size '${size.max}'.`
      );
    }
  }

  // Get a resource instance to work with AutoScalingGroup in the proper
  // AWS account.
  let accountName = yield Environment.getAccountNameForEnvironment(command.environmentName);
  let resource = yield asgResourceFactory.create(undefined, {
    accountName
  });

  let subnets;

  let network = command.parameters.network;
  if (!_.isNil(network)) {
    let environment = yield Environment.getByName(command.environmentName);
    let environmentType = yield EnvironmentType.getByName(environment.EnvironmentType);
    let asg = yield resource.get({
      name: command.autoScalingGroupName
    });

    let currentSubnet = asg.VPCZoneIdentifier.split(',')[0];
    let currentSubnetType = getSubnetTypeBySubnet(environmentType.Subnets, currentSubnet);

    subnets = yield subnetsProvider.get({
      serverRole: {
        SecurityZone: asg.getTag('SecurityZone'),
        SubnetTypeName: currentSubnetType.name,
        AvailabilityZoneName: network.availabilityZoneName
      },
      environmentType,
      environmentTypeName: environment.EnvironmentType
    });
  }

  let scaling = command.parameters.scaling;

  let parameters = {
    name: command.autoScalingGroupName,
    minSize: size.min,
    desiredSize: size.desired,
    maxSize: size.max,
    subnets,
    scaling
  };

  return resource.put(parameters);
}

function getSubnetTypeBySubnet(subnetTypes, subnet) {
  let subnetTypeArray = _.keys(subnetTypes).map((key) => {
    let subnetType = unMapSubnetType(key, subnetTypes[key]);
    return subnetType;
  });
  return _.find(subnetTypeArray, subnetType => subnetType.hasSubnet(subnet));
}

function unMapSubnetType(subnetTypeName, subnetType) {
  let azs = _.keys(subnetType)
    .filter(key => key.startsWith('AvailabilityZone'))
    .map(key => ({
      name: key,
      subnet: subnetType[key]
    }));

  return {
    name: subnetTypeName,
    availabilityZones: azs,
    secure: !!subnetType.Secure,
    hasSubnet: subnet => _.some(azs, az => az.subnet === subnet)
  };
}

module.exports = co.wrap(handler);


/***/ }),
/* 246 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let co = __webpack_require__(0);
const asgScheduledActionsResourceFactory = __webpack_require__(247);

function* GetAutoScalingGroupScheduledActions(query) {
  assert(query.accountName);
  assert(query.autoScalingGroupName);

  // Create an instance of the resource to work with based on the resource
  // descriptor and AWS account name.
  let parameters = { accountName: query.accountName };
  let resource = yield asgScheduledActionsResourceFactory.create(undefined, parameters);

  // Get AutoScalingGroup's Scheduled Actions by name
  return resource.get({ name: query.autoScalingGroupName });
}

module.exports = co.wrap(GetAutoScalingGroupScheduledActions);


/***/ }),
/* 247 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let amazonClientFactory = __webpack_require__(14);
let AsgScheduledActionsResource = __webpack_require__(248);
let logger = __webpack_require__(2);

module.exports = {

  canCreate: resourceDescriptor => resourceDescriptor.type.toLowerCase() === 'asgs-scheduled-actions',

  create: (resourceDescriptor, parameters) => {
    logger.debug(`Getting ASG client for account "${parameters.accountName}"...`);
    return amazonClientFactory.createASGClient(parameters.accountName)
      .then(client => new AsgScheduledActionsResource(client));
  }

};


/***/ }),
/* 248 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let AwsError = __webpack_require__(33);
let AutoScalingGroupNotFoundError = __webpack_require__(75);

function AsgScheduledActionsResource(client) {
  function describeScheduledActions(name) {
    return client.describeScheduledActions({ AutoScalingGroupName: name }).promise();
  }

  this.get = function (parameters) {
    return describeScheduledActions(parameters.name).then((result) => {
      if (result.ScheduledUpdateGroupActions) {
        return {
          ScheduledActions: result.ScheduledUpdateGroupActions.map(action => (
            {
              MinSize: action.MinSize,
              MaxSize: action.MaxSize,
              DesiredCapacity: action.DesiredCapacity,
              Recurrence: action.Recurrence
            }
          ))
        };
      }
      throw new AutoScalingGroupNotFoundError(`AutoScalingGroup "${parameters.name}" not found.`);
    }).catch((error) => {
      throw new AwsError(error.message);
    });
  };
}

module.exports = AsgScheduledActionsResource;


/***/ }),
/* 249 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let co = __webpack_require__(0);
const asgLifeCycleHooksResourceFactory = __webpack_require__(250);

function* GetAutoScalingGroupLifeCycleHooks(query) {
  assert(query.accountName);
  assert(query.autoScalingGroupName);

  // Create an instance of the resource to work with based on the resource
  // descriptor and AWS account name.
  let parameters = { accountName: query.accountName };
  let resource = yield asgLifeCycleHooksResourceFactory.create(undefined, parameters);

  // Get AutoScalingGroup's Scheduled Actions by name
  return resource.get({ name: query.autoScalingGroupName });
}

module.exports = co.wrap(GetAutoScalingGroupLifeCycleHooks);


/***/ }),
/* 250 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let amazonClientFactory = __webpack_require__(14);
let AsgLifeCycleHooksResource = __webpack_require__(251);
let logger = __webpack_require__(2);

module.exports = {

  canCreate: resourceDescriptor => resourceDescriptor.type.toLowerCase() === 'asgs-scheduled-actions',

  create: (resourceDescriptor, parameters) => {
    logger.debug(`Getting ASG client for account "${parameters.accountName}"...`);
    return amazonClientFactory.createASGClient(parameters.accountName)
      .then(client => new AsgLifeCycleHooksResource(client));
  }

};


/***/ }),
/* 251 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let AwsError = __webpack_require__(33);
let AutoScalingGroupNotFoundError = __webpack_require__(75);

function AsgLifeCycleHooksResource(client) {
  function describeLifeCycleHooks(name) {
    return client.describeLifecycleHooks({ AutoScalingGroupName: name }).promise();
  }

  this.get = function (parameters) {
    return describeLifeCycleHooks(parameters.name).then((result) => {
      if (result.LifecycleHooks) {
        return result.LifecycleHooks;
      }
      throw new AutoScalingGroupNotFoundError(`AutoScalingGroup "${parameters.name}" not found.`);
    }).catch((error) => {
      throw new AwsError(error.message);
    });
  };
}

module.exports = AsgLifeCycleHooksResource;


/***/ }),
/* 252 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let Enums = __webpack_require__(11);
let co = __webpack_require__(0);
let getASG = __webpack_require__(56);
let Environment = __webpack_require__(9);

function* getASGReady({ autoScalingGroupName, environmentName }) {
  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    return getASG({ accountName, autoScalingGroupName }).then((data) => {
      let instances = data.Instances;
      let instancesInService = _.filter(instances, { LifecycleState: Enums.ASGLifecycleState.IN_SERVICE });
      let instancesByLifecycleState = _(instances).groupBy('LifecycleState').mapValues(list => list.length).value();

      return {
        ReadyToDeploy: instancesInService.length === instances.length,
        InstancesByLifecycleState: instancesByLifecycleState,
        InstancesTotalCount: instances.length
      };
    });
  });
}

module.exports = co.wrap(getASGReady);


/***/ }),
/* 253 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let aws = __webpack_require__(29);

function passSafetyNet(name) {
  let root = name.split('/')[0];
  if (root !== 'EnvironmentManagerConfigurationChange'
    && root !== 'EnvironmentManagerOperationsChange') {
    return false;
  }

  return true;
}

module.exports = (name) => {
  const sns = new aws.SNS();
  const valid = /^[a-zA-Z0-9\-\_]+$/;

  return new Promise((resolve, reject) => {
    if (!name) {
      reject('When creating a topic, a name parameter must be provided.');
    }
    if (name.length > 256) {
      reject('When creating a topic, a name parameter should be a maximum of 256 characters.');
    }
    if (!valid.test(name)) {
      /* eslint-disable max-len*/
      reject('When creating a topic, a name parameter must be made up of only uppercase and lowercase ASCII letters, numbers, underscores, and hyphens.');
    }
    if (!passSafetyNet(name)) {
      reject(`Current allowed topics list does not contain ${name}`);
    }

    sns.createTopic({ Name: name }, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};


/***/ }),
/* 254 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */



module.exports = (ResponseMetadata) => {
  if (!ResponseMetadata.TopicArn) {
    throw new Error('ResponseMetadata does not contain a TopicArn value to extract.');
  }

  return ResponseMetadata.TopicArn;
};


/***/ }),
/* 255 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */



const util = __webpack_require__(8);

module.exports = (event) => {
  // eslint-disable-next-line no-console
  console.log(`Creating event for ${util.inspect(event, { depth: null })}`);

  if (!event) {
    throw new Error('Expected a configuration object when creating an event.');
  }
  if (!event.message) {
    throw new Error('Missing expected message attribute.');
  }
  if (event.attributes) {
    checkAttributes(event);
  }
  return (target) => {
    return {
      Message: event.message,
      MessageAttributes: event.attributes,
      TargetArn: target
    };
  };
};

function checkAttributes(event) {
  const validAttrs = [
    'EnvironmentType',
    'Environment',
    'OwningCluster',
    'User',
    'Result',
    'Timestamp',
    'Action',
    'ID',
    'EntityURL'
  ];

  let foundNonValidAttributes = [];

  Object.keys(event.attributes).forEach((k) => {
    if (!validAttrs.includes(k)) {
      foundNonValidAttributes.push(k);
    } else {
      event.attributes[k] = turnProvidedValueIntoSnsAttribute(event.attributes[k]);
    }
  });

  if (!event.attributes.Timestamp) {
    event.attributes.Timestamp = turnProvidedValueIntoSnsAttribute(Date.now().toString());
  }

  if (foundNonValidAttributes.length > 0) {
    throw new Error(`Non valid attributes provided: ${foundNonValidAttributes.join(',')}`);
  }
}

function turnProvidedValueIntoSnsAttribute(value) {
  return {
    DataType: 'String',
    StringValue: value
  };
}


/***/ }),
/* 256 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */



let aws = __webpack_require__(29);

module.exports = (event) => {
  if (!event.TargetArn) {
    throw new Error('An event to be published must contain a TargetArn property.');
  }

  if (!event.Message) {
    throw new Error('An event to be published must contain a Message property.');
  }

  if (event.MessageAttributes) {
    Object.keys(event.MessageAttributes).forEach((k) => {
      if (!event.MessageAttributes[k].DataType) {
        throw new Error('All MessageAttribute values must contain a DataType property.');
      }
    });
  }

  const sns = new aws.SNS();

  return new Promise((resolve, reject) => {
    sns.publish(event, (err, result) => {
      if (err) reject(err);
      return resolve(result);
    });
  });
};


/***/ }),
/* 257 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let notImplemented = __webpack_require__(258);
let { getTableName } = __webpack_require__(13);

/* eslint-disable import/no-extraneous-dependencies */
let auditLogReader = __webpack_require__(259);
let base64 = __webpack_require__(123);
let logger = __webpack_require__(2);
let weblink = __webpack_require__(261);
/* eslint-enable import/no-extraneous-dependencies */

let fp = __webpack_require__(4);
let Instant = __webpack_require__(30).Instant;
let LocalDate = __webpack_require__(30).LocalDate;
let ZoneOffset = __webpack_require__(30).ZoneOffset;
let url = __webpack_require__(63);

function createAuditLogQuery(since, until, exclusiveStartKey, perPage, filter) {
  let rq = {
    maxDate: until.toString(),
    minDate: since.toString()
  };
  if (perPage) {
    rq.limit = perPage;
  }
  if (exclusiveStartKey) {
    rq.exclusiveStartKey = exclusiveStartKey;
  }
  if (filter) {
    rq.filter = filter;
  }
  return rq;
}

function createFilter(query) {
  logger.debug('Audit History: Creating filter.');
  let exprs = {
    'Entity.Type': val => (val === 'ConfigLBUpstream' || val === 'ConfigLBSettings'
      ? ['or',
        ['=', ['attr', 'Entity', 'Type'], ['val', getTableName(val)]],
        ['=', ['attr', 'Entity', 'Type'], ['val', getTableName(`Infra${val}`)]]]
      : ['=', ['attr', 'Entity', 'Type'], ['val', getTableName(val)]]),
    'ChangeType': val => ['=', ['attr', 'ChangeType'], ['val', val]],
    'Entity.Key': val => ['=', ['attr', 'Entity', 'Key'], ['val', val]]
  };

  let filter = fp.flow(
    fp.pick(fp.keys(exprs)),
    fp.toPairs,
    fp.map(x => exprs[x[0]](x[1])),
    predicates => (predicates.length > 0 ? ['and'].concat(predicates) : undefined));

  return filter(query);
}

/**
 * GET /audit
 */
function getAuditLogs(request, response, next) {
  let redirectUrl = url.parse(request.originalUrl, true);
  redirectUrl.search = null;
  let query = redirectUrl.query;

  function paramOrDefault(param, fn, defaultValue) {
    function f(x) {
      try {
        return fn(x);
      } catch (error) {
        logger.error(error);
        throw new Error(`Error parsing parameter: ${param}`);
      }
    }
    let t = fp.has(param)(query) ? fp.flow(fp.get(param), f)(query) : defaultValue;
    return t;
  }

  function convertDateOrNow(date) {
    if (date === undefined) {
      return LocalDate.now(ZoneOffset.UTC);
    }
    return LocalDate.ofInstant(Instant.ofEpochMilli(date));
  }

  logger.debug('Audit History: Extracting parameters from request.');
  let since = convertDateOrNow(request.swagger.params.since.value);
  let until = convertDateOrNow(request.swagger.params.until.value);

  let exclusiveStartKey = paramOrDefault('exclusiveStartKey', base64.decode, undefined);

  let filter = createFilter(query);
  let auditLogQuery = createAuditLogQuery(since, until, exclusiveStartKey, query.per_page, filter);
  return auditLogReader.getLogs(auditLogQuery)
    .then((auditLog) => {
      logger.debug('Audit History: Constructing navigation links');
      query.since = since.toString();
      query.until = until.toString();
      if (auditLog.LastEvaluatedKey) {
        query.exclusiveStartKey = base64.encode(auditLog.LastEvaluatedKey);
        response.header('Link', weblink.link({ next: url.format(redirectUrl) }));
      }
      logger.debug('Audit History: sending response');
      return response.status(200).send(auditLog.Items);
    }).catch(next);
}

/**
 * GET /audit/{key}
 */
function getAuditLogByKey(req, res) {
  notImplemented(res, 'Getting a specific audit log by key');
}

module.exports = {
  getAuditLogs,
  getAuditLogByKey
};


/***/ }),
/* 258 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



function notImplemented(res, reason) {
  res.status(501);
  throw new Error(`Sorry, this action is not yet implemented: ${reason}`);
}

module.exports = notImplemented;


/***/ }),
/* 259 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const masterAccountClient = __webpack_require__(16);
const dynamodbExpression = __webpack_require__(69);
const LocalDate = __webpack_require__(30).LocalDate;

const awsResourceNameProvider = __webpack_require__(13);
const qname = awsResourceNameProvider.getTableName;
const InfraChangeAudit = qname('InfraChangeAudit');
const InfraChangeAuditIndexName = 'Date-ISOTimestamp-index';

const dynamodbPromise = masterAccountClient.createDynamoClient();

function createQuery(date, limit, options, exclusiveStartKey) {
  let expressions = {
    KeyConditionExpression: ['=', ['attr', 'Date'], ['val', date]]
  };
  if (options.filter) {
    expressions.FilterExpression = options.filter;
  }
  let compiledExpressions = dynamodbExpression.compile(expressions);
  let t = {
    TableName: InfraChangeAudit,
    IndexName: InfraChangeAuditIndexName,
    Limit: limit,
    ScanIndexForward: false
  };
  if (exclusiveStartKey) {
    t.ExclusiveStartKey = exclusiveStartKey;
  }
  let result = Object.assign(t, compiledExpressions);
  return result;
}

// TODO: Double-check usage of this function
// eslint-disable-next-line no-unused-vars
function key(item) {
  return {
    AuditID: item.AuditID,
    Date: item.Date,
    ISOTimestamp: item.ISOTimestamp
  };
}

function getLogs(params) {
  let minPartitionKey = params.minDate;
  let maxPartitionKey = params.maxDate;

  function nextPartitionKey(prevKey) {
    return LocalDate.parse(prevKey).minusDays(1).toString();
  }

  function query(limit, date, exclusiveStartKey) {
    if (exclusiveStartKey) {
      if (Object.keys(exclusiveStartKey).length > 1) {
        return createQuery(exclusiveStartKey.Date, limit, params, exclusiveStartKey);
      } else {
        return createQuery(nextPartitionKey(exclusiveStartKey.Date), limit, params);
      }
    } else {
      return createQuery(date, limit, params);
    }
  }

  let documentClient = {
    queryAsync: queryParams => dynamodbPromise.then(client => client.query(queryParams).promise())
  };

  function inQueryDomain(partitionKey) {
    return (minPartitionKey <= partitionKey && partitionKey <= maxPartitionKey);
  }

  function lastEvaluatedKey(prev, response) {
    if (response.LastEvaluatedKey) {
      return response.LastEvaluatedKey;
    } else if (response.Items.length > 0) {
      let date = response.Items.map(x => x.Date)[response.Items.length - 1];
      return { Date: date };
    } else {
      return prev;
    }
  }

  function hasMore(partitionKey) {
    let hasMoreQuery = (t) => {
      let remaining = query(1, t);
      remaining.Select = 'COUNT';
      return remaining;
    };
    function recur(k, response) {
      if (!inQueryDomain(k)) {
        return Promise.resolve(false);
      }
      if (response.Count > 0) {
        return Promise.resolve(true);
      }
      let nextKey = nextPartitionKey(k);
      return documentClient.queryAsync(hasMoreQuery(nextKey)).then(recur.bind(null, nextKey));
    }
    return documentClient.queryAsync(hasMoreQuery(partitionKey)).then(recur.bind(null, partitionKey));
  }

  function loop(partitionKey, acc, response) {
    acc.Items = acc.Items.concat(response.Items);
    acc.LastEvaluatedKey = lastEvaluatedKey(acc.LastEvaluatedKey, response);
    let limit = params.limit - acc.Items.length;
    let nextKey = nextPartitionKey(partitionKey);
    if (!{}.hasOwnProperty.call(response, 'LastEvaluatedKey') && (!inQueryDomain(nextKey) || !hasMore(nextKey))) {
      delete acc.LastEvaluatedKey;
      return Promise.resolve(acc);
    }
    if (limit <= 0) {
      return Promise.resolve(acc);
    }
    return documentClient.queryAsync(query(limit, nextKey, response.LastEvaluatedKey)).then(loop.bind(null, nextKey, acc));
  }

  let firstPartitionKey = params.exclusiveStartKey ? params.exclusiveStartKey.Date : params.maxDate;
  return documentClient.queryAsync(query(params.limit, params.maxDate, params.exclusiveStartKey))
    .then(loop.bind(null, firstPartitionKey, { Items: [] }));
}

module.exports = {
  getLogs
};


/***/ }),
/* 260 */
/***/ (function(module, exports) {

module.exports = require("buffer");

/***/ }),
/* 261 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const _ = __webpack_require__(1);
const url = __webpack_require__(63);

function link(links) {
  return _.map(links, (href, rel) => [`<${url.format(href)}>`, `rel="${rel}"`].join('; '))
    .join(', ');
}

module.exports = { link };


/***/ }),
/* 262 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let accounts = __webpack_require__(100);
let { getMetadataForDynamoAudit } = __webpack_require__(20);
let param = __webpack_require__(21);
let { validate } = __webpack_require__(263);
let { versionOf } = __webpack_require__(15);
let { removeAuditMetadata } = __webpack_require__(17);
let sns = __webpack_require__(12);

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

/**
 * GET /config/accounts
 */
function getAccountsConfig(req, res, next) {
  return accounts.scan()
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * POST /config/accounts
 */
function postAccountsConfig(req, res, next) {
  const account = req.swagger.params.account.value;
  let metadata = getMetadataForDynamoAudit(req);
  let record = account;
  return validate(account)
    .then(() => accounts.create({ record, metadata }))
    .then(() => res.status(201).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/config/accounts',
          Method: 'POST'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: `${account.AccountNumber}`
      }
    }))
    .catch(next);
}

/**
 * PUT /config/accounts/{accountNumber}
 */
function putAccountConfigByName(req, res, next) {
  const AccountNumber = req.swagger.params.accountNumber.value;
  const account = req.swagger.params.account.value;
  const expectedVersion = param('expected-version', req);

  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(account, { AccountNumber });

  return validate(account)
    .then(() => accounts.replace({ record, metadata }, expectedVersion))
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/accounts/${AccountNumber}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: `${AccountNumber}`
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/accounts/{accountNumber}
 */
function deleteAccountConfigByName(req, res, next) {
  const AccountNumber = req.swagger.params.accountNumber.value;
  const expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  return accounts.delete({ key: { AccountNumber }, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/accounts/${AccountNumber}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: `${AccountNumber}`
      }
    }))
    .catch(next);
}

module.exports = {
  getAccountsConfig,
  postAccountsConfig,
  putAccountConfigByName,
  deleteAccountConfigByName
};


/***/ }),
/* 263 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let childAWSclient = __webpack_require__(14);
let logger = __webpack_require__(2);
let co = __webpack_require__(0);

function validate(account) {
  return co(function* () {
    let flags = ['IncludeAMIs'];
    let required = flags.concat(['AccountName', 'AccountNumber', 'RoleArn']);

    Object.keys(account).forEach((k) => {
      if (required.indexOf(k) < 0) throw new Error(`'${k}' is not a valid attribute.`);
    });

    required.forEach((p) => {
      if (!{}.hasOwnProperty.call(account, p)) throw new Error(`Missing required attribute: ${p}`);
    });

    flags.forEach((f) => {
      if (typeof account[f] !== 'boolean') throw new Error(`Attribute ${f} must be boolean`);
    });

    validateAccountNumber(account.AccountNumber);

    try {
      yield childAWSclient.assumeRole(account.RoleArn);
    } catch (error) {
      logger.error(`Rejected attempt to add account ${account.AccountName} with role ARN ${account.RoleArn}`);
      throw new Error(`Cannot assume role for ARN: ${account.RoleArn}`);
    }

    return true;
  });
}

function validateAccountNumber(accountNumber) {
  if (!Number.isInteger(accountNumber) || accountNumber > 999999999999) {
    throw new Error('AccountNumber must be a (max) 12 digit integer');
  }
}

module.exports = { validate, validateAccountNumber };


/***/ }),
/* 264 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const KEY_NAME = 'ClusterName';

let clusters = __webpack_require__(105);
let getMetadataForDynamoAudit = __webpack_require__(20).getMetadataForDynamoAudit;
let param = __webpack_require__(21);
let versionOf = __webpack_require__(15).versionOf;
let removeAuditMetadata = __webpack_require__(17).removeAuditMetadata;
const sns = __webpack_require__(12);
let { hasValue, when } = __webpack_require__(23);
let { ifNotFound, notFoundMessage } = __webpack_require__(24);

function keyOf(value) {
  let t = {};
  t[KEY_NAME] = value;
  return t;
}

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

/**
 * GET /config/clusters
 */
function getClustersConfig(req, res, next) {
  return clusters.scan()
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data)).catch(next);
}

/**
 * GET /config/clusters/{name}
 */
function getClusterConfigByName(req, res, next) {
  const key = param('name', req);
  return clusters.get(keyOf(key))
    .then(when(hasValue, convertToApiModel))
    .then(ifNotFound(notFoundMessage('cluster')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/clusters
 */
function postClustersConfig(req, res, next) {
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign({}, body);
  delete record.Version;
  return clusters.create({ record, metadata })
    .then(() => res.status(201).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/config/clusters',
          Method: 'POST'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: ''
      }
    }))
    .catch(next);
}

/**
 * PUT /config/clusters/{name}
 */
function putClusterConfigByName(req, res, next) {
  const key = param('name', req);
  const expectedVersion = param('expected-version', req);
  const body = param('body', req);

  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(keyOf(key), { Value: body });
  delete record.Version;

  return clusters.replace({ record, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/clusters/${key}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: key
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/clusters/{name}
 */
function deleteClusterConfigByName(req, res, next) {
  const clusterName = param('name', req);
  const expectedVersion = param('expected-version', req);

  let key = keyOf(clusterName);
  let metadata = getMetadataForDynamoAudit(req);

  return clusters.delete({ key, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/clusters/${key}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: clusterName
      }
    }))
    .catch(next);
}

module.exports = {
  getClustersConfig,
  getClusterConfigByName,
  postClustersConfig,
  putClusterConfigByName,
  deleteClusterConfigByName
};


/***/ }),
/* 265 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let deploymentMaps = __webpack_require__(104);
let getMetadataForDynamoAudit = __webpack_require__(20).getMetadataForDynamoAudit;
let param = __webpack_require__(21);
let versionOf = __webpack_require__(15).versionOf;
let removeAuditMetadata = __webpack_require__(17).removeAuditMetadata;
const sns = __webpack_require__(12);
let { hasValue, when } = __webpack_require__(23);
let { ifNotFound, notFoundMessage } = __webpack_require__(24);

const KEY_NAME = 'DeploymentMapName';
function keyOf(value) {
  let t = {};
  t[KEY_NAME] = value;
  return t;
}

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

/**
 * GET /config/deployment-maps
 */
function getDeploymentMapsConfig(req, res, next) {
  return deploymentMaps.scan()
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/deployment-maps/{name}
 */
function getDeploymentMapConfigByName(req, res, next) {
  let key = param('name', req);
  return deploymentMaps.get(keyOf(key))
    .then(when(hasValue, convertToApiModel))
    .then(ifNotFound(notFoundMessage('deployment map')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/deployment-maps
 */
function postDeploymentMapsConfig(req, res, next) {
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = body;
  delete record.Version;
  return deploymentMaps.create({ record, metadata })
    .then(() => res.status(201).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/config/deployment-maps',
          Method: 'POST'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: ''
      }
    }))
    .catch(next);
}

/**
 * PUT /config/deployment-maps/{name}
 */
function putDeploymentMapConfigByName(req, res, next) {
  const key = param('name', req);
  const expectedVersion = param('expected-version', req);
  const body = param('body', req);

  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(keyOf(key), { Value: body });
  delete record.Version;

  return deploymentMaps.replace({ record, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/deployment-maps/${key}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: key
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/deployment-maps/{name}
 */
function deleteDeploymentMapConfigByName(req, res, next) {
  const key = keyOf(param('name', req));
  let metadata = getMetadataForDynamoAudit(req);

  return deploymentMaps.delete({ key, metadata })
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/deployment-maps/${key}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: key
      }
    }))
    .catch(next);
}

module.exports = {
  getDeploymentMapsConfig,
  getDeploymentMapConfigByName,
  postDeploymentMapsConfig,
  putDeploymentMapConfigByName,
  deleteDeploymentMapConfigByName
};


/***/ }),
/* 266 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const KEY_NAME = 'EnvironmentType';

let configEnvironmentTypes = __webpack_require__(55);
let getMetadataForDynamoAudit = __webpack_require__(20).getMetadataForDynamoAudit;
let param = __webpack_require__(21);
let { versionOf } = __webpack_require__(15);
const sns = __webpack_require__(12);
let { hasValue, when } = __webpack_require__(23);
let { ifNotFound, notFoundMessage } = __webpack_require__(24);

function keyOf(value) {
  let t = {};
  t[KEY_NAME] = value;
  return t;
}

function convertToApiModel(persistedModel) {
  let Version = versionOf(persistedModel);
  return Object.assign(persistedModel, { Version });
}

/**
 * GET /config/environment-types
 */
function getEnvironmentTypesConfig(req, res, next) {
  return configEnvironmentTypes.scan()
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/environment-types/{name}
 */
function getEnvironmentTypeConfigByName(req, res, next) {
  const key = param('name', req);
  return configEnvironmentTypes.get(keyOf(key))
    .then(when(hasValue, convertToApiModel))
    .then(ifNotFound(notFoundMessage('environment type')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/environment-types
 */
function postEnvironmentTypesConfig(req, res, next) {
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign({}, body);
  delete record.Version;
  return configEnvironmentTypes.create({ record, metadata })
    .then(() => res.status(201).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/config/environment-types',
          Method: 'POST'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: ''
      }
    }))
    .catch(next);
}

/**
 * PUT /config/environment-types/{name}
 */
function putEnvironmentTypeConfigByName(req, res, next) {
  const key = param('name', req);
  const expectedVersion = param('expected-version', req);
  const body = param('body', req);

  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(keyOf(key), { Value: body });
  delete record.Version;

  return configEnvironmentTypes.replace({ record, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/environment-types/${key}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: key
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/environment-types/{name}
 */
function deleteEnvironmentTypeConfigByName(req, res, next) {
  const clusterName = param('name', req);

  let key = keyOf(clusterName);
  let metadata = getMetadataForDynamoAudit(req);

  return configEnvironmentTypes.delete({ key, metadata })
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/environment-types/${clusterName}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: clusterName
      }
    }))
    .catch(next);
}

module.exports = {
  getEnvironmentTypesConfig,
  getEnvironmentTypeConfigByName,
  postEnvironmentTypesConfig,
  putEnvironmentTypeConfigByName,
  deleteEnvironmentTypeConfigByName
};


/***/ }),
/* 267 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let Promise = __webpack_require__(10);

let getMetadataForDynamoAudit = __webpack_require__(20).getMetadataForDynamoAudit;
let removeAuditMetadata = __webpack_require__(17).removeAuditMetadata;
let versionOf = __webpack_require__(15).versionOf;
let param = __webpack_require__(21);

let configEnvironments = __webpack_require__(18);
let opsEnvironment = __webpack_require__(45);
let loadBalancerUpstreams = __webpack_require__(38);
let loadBalancerSettings = __webpack_require__(124);

let EnvironmentType = __webpack_require__(43);

let consul = __webpack_require__(107);
const sns = __webpack_require__(12);

let { hasValue, when } = __webpack_require__(23);
let { ifNotFound, notFoundMessage } = __webpack_require__(24);

function attachMetadata(input) {
  input.Version = versionOf(input);
  return EnvironmentType.getByName(input.Value.EnvironmentType)
    .then((environmentType) => {
      input.AWSAccountNumber = environmentType.AWSAccountNumber;
      return input;
    });
}

/**
 * GET /config/environments
 */
function getEnvironmentsConfig(req, res, next) {
  const environmentType = param('environmentType', req);
  const cluster = param('cluster', req);

  let getResults = () => {
    let predicates = [
      ...(cluster ? [['=', ['at', 'Value', 'OwningCluster'], ['val', cluster]]] : []),
      ...(environmentType ? [['=', ['at', 'Value', 'EnvironmentType'], ['val', environmentType]]] : [])
    ];
    if (predicates.length === 0) {
      return configEnvironments.scan();
    } else {
      let filter = predicates.length === 1 ? predicates[0] : ['and', ...predicates];
      return configEnvironments.scan({ FilterExpression: filter });
    }
  };

  return Promise.map(getResults(), attachMetadata)
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/environments/{name}
 */
function getEnvironmentConfigByName(req, res, next) {
  let key = {
    EnvironmentName: param('name', req)
  };
  return configEnvironments.get(key)
    .then(when(hasValue, attachMetadata))
    .then(when(hasValue, removeAuditMetadata))
    .then(ifNotFound(notFoundMessage('environment')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/environments
 */
function postEnvironmentsConfig(req, res, next) {
  let configEnv = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let opsEnv = {
    EnvironmentName: configEnv.EnvironmentName,
    Value: {}
  };
  return Promise.all([
    configEnvironments.create({ record: configEnv, metadata }),
    opsEnvironment.create({ record: opsEnv, metadata })
  ])
    .then(() => res.status(201).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/config/environments',
          Method: 'POST'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: configEnv.EnvironmentName || 'None'
      }
    }))
    .catch(next);
}

/**
 * PUT /config/environments/{name}
 */
function putEnvironmentConfigByName(req, res, next) {
  let environmentName = param('name', req);
  let key = {
    EnvironmentName: environmentName
  };
  let expectedVersion = param('expected-version', req);
  let body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(key, { Value: body });

  return configEnvironments.replace({ record, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/environments/${environmentName}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: environmentName
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/environments/{name}
 */
function deleteEnvironmentConfigByName(req, res, next) {
  const environmentName = param('name', req);
  let key = {
    EnvironmentName: environmentName
  };
  let metadata = getMetadataForDynamoAudit(req);

  return Promise.all([
    deleteLBSettingsForEnvironment(environmentName, metadata),
    deleteLBUpstreamsForEnvironment(environmentName, metadata),
    deleteConsulKeyValuePairs(environmentName)
  ])
    .then(() => opsEnvironment.delete({ key, metadata }))
    .then(() => configEnvironments.delete({ key, metadata }))
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/environments/${environmentName}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: environmentName
      }
    }))
    .catch(next);
}

function deleteConsulKeyValuePairs(environmentName) {
  return consul.removeTargetState(environmentName, { key: `environments/${environmentName}`, recurse: true });
}

function deleteLBSettingsForEnvironment(environmentName, metadata) {
  let params = {
    KeyConditionExpression: ['=', ['at', 'EnvironmentName'], ['val', environmentName]],
    ProjectionExpression: ['list', ', ', ['at', 'EnvironmentName'], ['at', 'VHostName'], ['at', 'Audit', 'Version']]
  };
  return loadBalancerSettings.query(params)
    .then(items => Promise.map(items, ({ EnvironmentName, VHostName, Audit: { Version: expectedVersion } }) =>
      loadBalancerSettings.delete({ key: { EnvironmentName, VHostName }, metadata }, expectedVersion)));
}

function deleteLBUpstreamsForEnvironment(environmentName, metadata) {
  return loadBalancerUpstreams.inEnvironment(environmentName)
    .then(({ Items }) => Promise.map(Items, ({ Key, Audit: { Version: expectedVersion } }) =>
      loadBalancerUpstreams.delete({ key: { Key }, metadata }, expectedVersion)));
}

module.exports = {
  getEnvironmentsConfig,
  getEnvironmentConfigByName,
  postEnvironmentsConfig,
  putEnvironmentConfigByName,
  deleteEnvironmentConfigByName
};


/***/ }),
/* 268 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let { getTableName: physicalTableName } = __webpack_require__(13);
let dynamoTable = __webpack_require__(48);
let singleAccountDynamoTable = __webpack_require__(67);
let logicalTableName = __webpack_require__(125);

/**
 * GET /config/export/{resource}
 */
function getResourceExport(req, res, next) {
  const resourceParam = req.swagger.params.resource.value;
  return Promise.resolve()
    .then(() => singleAccountDynamoTable(physicalTableName(logicalTableName(resourceParam)), dynamoTable))
    .then(table => table.scan())
    .then(data => res.json(data))
    .catch(next);
}

module.exports = {
  getResourceExport
};


/***/ }),
/* 269 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let logicalTableName = __webpack_require__(125);
let { getTableName } = __webpack_require__(13);
const sns = __webpack_require__(12);
let dynamoImport = __webpack_require__(270);

/**
 * PUT /config/import/{resource}
 */
function putResourceImport(req, res, next) {
  const resource = req.swagger.params.resource.value;
  const value = req.swagger.params.data.value;
  const mode = req.swagger.params.mode.value;

  let params = {
    items: value,
    table: getTableName(logicalTableName(resource)),
    remove: mode === 'replace'
  };

  return dynamoImport(params)
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/import/${resource}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: req.swagger.params.resource.value
      }
    }))
    .catch(next);
}

module.exports = {
  putResourceImport
};


/***/ }),
/* 270 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let fp = __webpack_require__(4);
let Promise = __webpack_require__(10);
let pages = __webpack_require__(49);
let { createDynamoClient: DocumentClient, createLowLevelDynamoClient: DynamoDB } = __webpack_require__(16);
let { extractKey, keyAttributeNames } = __webpack_require__(47);

function byKeyEqualityComparer(tableDescription) {
  let attrs = keyAttributeNames(tableDescription);
  return (x, y) => attrs.every(a => x[a] === y[a]);
}

function setDifference(equalsFn, xs, ys) {
  return xs.filter(x => !ys.some(y => equalsFn(x, y)));
}

function importItems({ items: importedItems, table: TableName, remove = false }) {
  return Promise.join(
    DocumentClient(),
    DynamoDB().then(dynamo => dynamo.describeTable({ TableName }).promise()),
    (table, description) => {
      function put(item) {
        let key = extractKey(description, item);
        return table.put({ TableName, Item: item }).promise()
          .then(() => ({ operation: 'put', key, status: 'success' }))
          .catch(() => ({ operation: 'put', key, status: 'failure' }));
      }

      function $delete(item) {
        let key = extractKey(description, item);
        return table.delete({ TableName, Key: key }).promise()
          .then(() => ({ operation: 'delete', key, status: 'success' }))
          .catch(() => ({ operation: 'delete', key, status: 'failure' }));
      }

      function getExistingItemsNotImported() {
        let keyAttrs = keyAttributeNames(description);
        return pages.flatten(rsp => rsp.Items, table.scan({
          TableName,
          ProjectionExpression: keyAttrs.map(a => `#${a}`).join(', '),
          ExpressionAttributeNames: fp.fromPairs(keyAttrs.map(a => [`#${a}`, a]))
        }))
          .then(existingItems => setDifference(byKeyEqualityComparer(description), existingItems, importedItems));
      }

      let operations = [
        Promise.map(importedItems, put, { concurrency: 10 }),
        (remove ? Promise.map(getExistingItemsNotImported(), $delete, { concurrency: 10 }) : Promise.resolve([]))
      ];

      return Promise.all(operations).then(fp.flatten);
    });
}


module.exports = importItems;


/***/ }),
/* 271 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let Promise = __webpack_require__(10);
let { flatten, flow } = __webpack_require__(4);
let { convertToNewModel, convertToOldModel } = __webpack_require__(272);
let loadBalancerSettings = __webpack_require__(124);
let { getMetadataForDynamoAudit } = __webpack_require__(20);
let param = __webpack_require__(21);
let { versionOf } = __webpack_require__(15);
let { removeAuditMetadata } = __webpack_require__(17);
let { hasValue, when } = __webpack_require__(23);
let { ifNotFound, notFoundMessage } = __webpack_require__(24);

const sns = __webpack_require__(12);

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

let notify = sns.publish.bind(sns);

/**
 * GET /config/lb-settings
 */
function getLBSettingsConfig(req, res, next) {
  const environmentName = param('environment', req);
  const frontend = param('frontend', req);
  const queryAttribute = param('qa', req);
  const queryValues = param('qv', req);

  function filterExpression(expressions) {
    let { length } = expressions;
    if (length === 0) {
      return {};
    } else if (length === 1) {
      let [FilterExpression] = expressions;
      return { FilterExpression };
    } else {
      let FilterExpression = ['and', ...expressions];
      return { FilterExpression };
    }
  }

  function keyConditionExpression(attribute, value) {
    switch (attribute) {
      case 'environment':
        return {
          KeyConditionExpression: ['=', ['at', 'EnvironmentName'], ['val', value]]
        };
      case 'load-balancer-group':
        return {
          IndexName: 'LoadBalancerGroup-index',
          KeyConditionExpression: ['=', ['at', 'LoadBalancerGroup'], ['val', value]]
        };
      default:
        return {};
    }
  }

  function get(attribute, value) {
    let filterExpressions = [
      (frontend !== undefined)
        ? ['=', ['at', 'Value', 'FrontEnd'], ['val', frontend !== false]]
        : undefined
    ];

    let expressions = Object.assign(
      keyConditionExpression(attribute, value),
      filterExpression(filterExpressions.filter(x => x !== undefined))
    );

    return expressions.KeyConditionExpression
      ? loadBalancerSettings.query(expressions)
      : loadBalancerSettings.scan(expressions);
  }

  return (() => {
    if (environmentName) {
      return get('environment', environmentName);
    } else if (queryAttribute && queryValues) {
      return Promise.map(queryValues, value => get(queryAttribute, value)).then(flatten);
    } else {
      return get();
    }
  })()
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/lb-settings/{environment}/{vHostName}
 */
function getLBSettingConfigByName(req, res, next) {
  const key = {
    EnvironmentName: param('environment', req),
    VHostName: param('vHostName', req)
  };
  return loadBalancerSettings.get(key)
    .then(when(hasValue, flow(convertToOldModel, convertToApiModel)))
    .then(ifNotFound(notFoundMessage('lb-setting')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/lb-settings
 */
function postLBSettingsConfig(req, res, next) {
  return Promise.resolve()
    .then(() => {
      const body = param('body', req);
      let metadata = getMetadataForDynamoAudit(req);
      let key = {
        EnvironmentName: body.EnvironmentName,
        VHostName: body.VHostName
      };
      return convertToNewModel(Object.assign(key, body))
        .then((record) => {
          delete record.Version;
          return { record, metadata };
        })
        .then(loadBalancerSettings.create)
        .then(() => res.status(201).end())
        .then(notify({
          message: JSON.stringify({
            Endpoint: {
              Url: '/config/lb-settings',
              Method: 'POST'
            }
          }),
          topic: sns.TOPICS.CONFIGURATION_CHANGE,
          attributes: {
            Action: sns.ACTIONS.POST,
            ID: body.VHostName
          }
        }));
    })
    .catch(next);
}

/**
 * PUT /config/lb-settings/{environment}/{vHostName}
 */
function putLBSettingConfigByName(req, res, next) {
  const key = {
    EnvironmentName: param('environment', req),
    VHostName: param('vHostName', req)
  };
  const Value = param('body', req);
  const expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  return convertToNewModel(Object.assign(key, { Value }))
    .then(record => loadBalancerSettings.put({ record, metadata }, expectedVersion))
    .then(() => res.status(200).end())
    .then(notify({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/lb-settings/${key.EnvironmentName}/${key.VHostName}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: param('vHostName', req)
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/lb-settings/{environment}/{vHostName}
 */
function deleteLBSettingConfigByName(req, res, next) {
  const key = {
    EnvironmentName: param('environment', req),
    VHostName: param('vHostName', req)
  };
  const expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  return loadBalancerSettings.delete({ key, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(notify({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/lb-settings/${key.EnvironmentName}/${key.VHostName}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: param('vHostName', req)
      }
    }))
    .catch(next);
}

module.exports = {
  getLBSettingsConfig,
  getLBSettingConfigByName,
  postLBSettingsConfig,
  putLBSettingConfigByName,
  deleteLBSettingConfigByName
};


/***/ }),
/* 272 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let { assign, omit } = __webpack_require__(4);
let environments = __webpack_require__(18);
let environmentTypes = __webpack_require__(55);

function getEnvironmentType(environmentName) {
  let rejectIfNotFound = msg => obj => (obj !== null ? Promise.resolve(obj) : Promise.reject(new Error(msg)));
  return environments.get({ EnvironmentName: environmentName })
    .then(rejectIfNotFound(`Environment not found: ${environmentName}`))
    .then(({ Value: { EnvironmentType } }) => environmentTypes.get({ EnvironmentType })
      .then(rejectIfNotFound(`Environment Type not found: ${EnvironmentType}`)));
}

function convertToOldModel(model) {
  return omit(['AccountId', 'LoadBalancerGroup'])(model);
}

function convertToNewModel(model) {
  return Promise.resolve(model)
  .then(({ EnvironmentName }) => getEnvironmentType(EnvironmentName))
  .then(environmentType => assign({
    AccountId: environmentType.Value.AWSAccountNumber,
    LoadBalancerGroup: environmentType.EnvironmentType
  })(model));
}

module.exports = {
  convertToOldModel,
  convertToNewModel
};


/***/ }),
/* 273 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let notificationSettings = __webpack_require__(274);
let getMetadataForDynamoAudit = __webpack_require__(20).getMetadataForDynamoAudit;
let param = __webpack_require__(21);
let versionOf = __webpack_require__(15).versionOf;
let removeAuditMetadata = __webpack_require__(17).removeAuditMetadata;
const sns = __webpack_require__(12);
let { hasValue, when } = __webpack_require__(23);
let { ifNotFound, notFoundMessage } = __webpack_require__(24);

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

/**
 * GET /config/notification-settings
 */
function getAllNotificationSettings(req, res, next) {
  return notificationSettings.scan()
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data)).catch(next);
}

/**
 * GET /config/notification-settings/{id}
 */
function getNotificationSettingsById(req, res, next) {
  let key = {
    NotificationSettingsId: param('id', req)
  };
  return notificationSettings.get(key)
    .then(when(hasValue, convertToApiModel))
    .then(ifNotFound(notFoundMessage('notification setting')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/notification-settings
 */
function postNotificationSettings(req, res, next) {
  let body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign({}, body);
  delete record.Version;
  return notificationSettings.create({ record, metadata })
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/config/notification-settings',
          Method: 'POST'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: ''
      }
    }))
    .catch(next);
}

/**
 * PUT /config/notification-settings/{id}
 */
function putNotificationSettingsById(req, res, next) {
  let notificationSettingsId = param('id', req);
  let key = {
    NotificationSettingsId: notificationSettingsId
  };
  let body = param('body', req);
  let expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign({}, key, { Value: body });
  delete record.Version;
  return notificationSettings.replace({ record, metadata }, expectedVersion)
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/notification-settings/${notificationSettingsId}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: notificationSettingsId
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/notification-settings/{id}
 */
function deleteNotificationSettingsById(req, res, next) {
  let notificationSettingsId = param('id', req);
  let key = {
    NotificationSettingsId: notificationSettingsId
  };
  let expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);
  return notificationSettings.delete({ key, metadata }, expectedVersion)
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/notification-settings/${notificationSettingsId}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: notificationSettingsId
      }
    }))
    .catch(next);
}

module.exports = {
  getAllNotificationSettings,
  getNotificationSettingsById,
  postNotificationSettings,
  putNotificationSettingsById,
  deleteNotificationSettingsById
};


/***/ }),
/* 274 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const LOGICAL_TABLE_NAME = 'ConfigNotificationSettings';
const TTL = 1200; // seconds

let physicalTableName = __webpack_require__(13).getTableName;
let cachedSingleAccountDynamoTable = __webpack_require__(22);

module.exports = cachedSingleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), { ttl: TTL });


/***/ }),
/* 275 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const KEY_NAME = 'Name';

let permissions = __webpack_require__(66);
let getMetadataForDynamoAudit = __webpack_require__(20).getMetadataForDynamoAudit;
let param = __webpack_require__(21);
let versionOf = __webpack_require__(15).versionOf;
let removeAuditMetadata = __webpack_require__(17).removeAuditMetadata;
const sns = __webpack_require__(12);
let { hasValue, when } = __webpack_require__(23);
let { ifNotFound, notFoundMessage } = __webpack_require__(24);

function keyOf(value) {
  let t = {};
  t[KEY_NAME] = value;
  return t;
}

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

/**
 * GET /config/permissions
 */
function getPermissionsConfig(req, res, next) {
  return permissions.scan()
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data)).catch(next);
}

/**
 * GET /config/permissions/{name}
 */
function getPermissionConfigByName(req, res, next) {
  const key = param('name', req);
  return permissions.get(keyOf(key))
    .then(when(hasValue, convertToApiModel))
    .then(ifNotFound(notFoundMessage('cluster')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/permissions
 */
function postPermissionsConfig(req, res, next) {
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign({}, body);
  delete record.Version;
  return permissions.create({ record, metadata })
    .then(() => res.status(201).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/config/permissions',
          Method: 'POST'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: body.Name
      }
    }))
    .catch(next);
}

/**
 * PUT /config/permissions/{name}
 */
function putPermissionConfigByName(req, res, next) {
  const key = param('name', req);
  const expectedVersion = param('expected-version', req);
  const body = param('body', req);

  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(keyOf(key), { Permissions: body });
  delete record.Version;

  return permissions.replace({ record, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/permissions/${key}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: key
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/permissions/{name}
 */
function deletePermissionConfigByName(req, res, next) {
  const name = param('name', req);
  const expectedVersion = param('expected-version', req);

  let key = keyOf(name);
  let metadata = getMetadataForDynamoAudit(req);

  return permissions.delete({ key, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/permissions/${key}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: name
      }
    }))
    .catch(next);
}

module.exports = {
  getPermissionsConfig,
  getPermissionConfigByName,
  postPermissionsConfig,
  putPermissionConfigByName,
  deletePermissionConfigByName
};


/***/ }),
/* 276 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



function getServerRoleByName(req, res) {
  res.json([{}, {}, {}]);
}

function postServerRole(req, res) {
  res.json({});
}

function putServerRoleByName(req, res) {
  res.json();
}

function deleteServerRoleByName(req, res) {
  res.json();
}

module.exports = {
  getServerRoleByName,
  postServerRole,
  putServerRoleByName,
  deleteServerRoleByName
};


/***/ }),
/* 277 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let services = __webpack_require__(28);
let getMetadataForDynamoAudit = __webpack_require__(20).getMetadataForDynamoAudit;
let param = __webpack_require__(21);
let versionOf = __webpack_require__(15).versionOf;
let removeAuditMetadata = __webpack_require__(17).removeAuditMetadata;
const sns = __webpack_require__(12);

let { hasValue, when } = __webpack_require__(23);
let { ifNotFound, notFoundMessage } = __webpack_require__(24);

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

/**
 * GET /config/services
 */
function getServicesConfig(req, res, next) {
  const returnDeleted = req.query.returnDeleted === 'true';
  const cluster = param('cluster', req);
  return (cluster ? services.ownedBy(cluster, returnDeleted) : services.scan(returnDeleted))
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/services/{name}
 */
function getServiceConfigByName(req, res, next) {
  let key = { ServiceName: param('name', req) };
  return services.get(key)
    .then(when(hasValue, convertToApiModel))
    .then(ifNotFound(notFoundMessage('service')))
    .then(send => send(res))
    .catch(next);
}

/**
 * GET /config/services/{name}/{cluster}
 */
function getServiceConfigByNameAndCluster(req, res, next) {
  let key = { ServiceName: param('name', req) };
  let owningCluster = param('cluster', req);

  let existsAndIsOwnedByCluster = x => hasValue(x) &&
    (x.OwningCluster.toLowerCase() === owningCluster.toLowerCase());

  return services.get(key)
    .then(when(existsAndIsOwnedByCluster, convertToApiModel))
    .then(ifNotFound(notFoundMessage('service')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/services
 */
function postServicesConfig(req, res, next) {
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign({}, body);
  delete record.Version;
  return services.create({ record, metadata })
    .then(() => res.status(201).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/config/services',
          Method: 'POST'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: `${body.ServiceName}`
      }
    }))
    .catch(next);
}

/**
 * PUT /config/services/{name}/{cluster}
 */
function putServiceConfigByName(req, res, next) {
  let serviceName = param('name', req);
  let owningCluster = param('cluster', req);
  let key = { ServiceName: serviceName };
  const expectedVersion = param('expected-version', req);
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(key, { OwningCluster: owningCluster }, { Value: body });
  delete record.Version;

  return services.replace({ record, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/services/${serviceName}/${owningCluster}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: `${serviceName}/${owningCluster}`
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/services/{name}
 */
function deleteServiceConfigByName(req, res, next) {
  let serviceName = param('name', req);
  let key = { ServiceName: serviceName };
  const expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  let updateExpression = ['update',
    ['set', ['at', 'Deleted'], ['val', 'true']]
  ];
  return services.update({ key, metadata, updateExpression }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/services/${serviceName}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: serviceName
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/services/{name}/{cluster} [DEPRECATED]
 */
function deleteServiceConfigByNameAndCluster(req, res, next) {
  let serviceName = param('name', req);
  let owningCluster = param('cluster', req);
  let key = { ServiceName: serviceName };
  const expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  let updateExpression = ['update',
    ['set', ['at', 'Deleted'], ['val', 'true']]
  ];
  return services.update({ key, metadata, updateExpression }, expectedVersion, { ConditionExpression: ['=', ['at', 'OwningCluster'], ['val', owningCluster]] })
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/services/${serviceName}/${owningCluster}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: `${serviceName}/${owningCluster}`
      }
    }))
    .catch(next);
}

module.exports = {
  getServicesConfig,
  getServiceConfigByName,
  getServiceConfigByNameAndCluster,
  postServicesConfig,
  putServiceConfigByName,
  deleteServiceConfigByName,
  deleteServiceConfigByNameAndCluster
};


/***/ }),
/* 278 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let Promise = __webpack_require__(10);
let logger = __webpack_require__(2);
let { assign, flatten, flow, map, omit } = __webpack_require__(4);
let { versionOf } = __webpack_require__(15);
let { removeAuditMetadata } = __webpack_require__(17);
let { convertToNewModel, convertToOldModel } = __webpack_require__(279);
let loadBalancerUpstreams = __webpack_require__(38);
let services = __webpack_require__(28);
let { getMetadataForDynamoAudit } = __webpack_require__(20);
let param = __webpack_require__(21);
let { validate } = __webpack_require__(280);
let { getByName: getAccount } = __webpack_require__(31);
let InvalidItemSchemaError = __webpack_require__(281);
const sns = __webpack_require__(12);

function rejectIfValidationFailed(validationResult) {
  if (!validationResult.isValid) {
    logger.info('Upstream Validation Failure', validationResult.err);
    return Promise.reject(new InvalidItemSchemaError(validationResult.err));
  } else {
    return Promise.resolve();
  }
}

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

/**
 * GET /config/upstreams
 */
function getUpstreamsConfig(req, res, next) {
  const environment = param('environment', req);
  const queryAttribute = param('qa', req);
  const queryValues = param('qv', req);

  function get(attribute, value) {
    return (() => {
      switch (attribute) {
        case 'environment':
          return loadBalancerUpstreams.inEnvironment(value);
        case 'load-balancer-group':
          return loadBalancerUpstreams.inLoadBalancerGroup(value);
        default:
          return loadBalancerUpstreams.scan();
      }
    })().then(({ Items }) => Items);
  }

  return (() => {
    if (environment) {
      return get('environment', environment);
    } else if (queryAttribute && queryValues) {
      return Promise.map(queryValues, value => get(queryAttribute, value)).then(flatten);
    } else {
      return get();
    }
  })()
    .then(map(flow(convertToOldModel, convertToApiModel)))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/upstreams/{name}
 */
function getUpstreamConfigByName(req, res, next) {
  let Key = param('name', req);
  return loadBalancerUpstreams.get({ Key })
    .then(flow(convertToOldModel, convertToApiModel))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * POST /config/upstreams
 */
function postUpstreamsConfig(req, res, next) {
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let oldRecord = omit('version')(body);
  let newRecordP = convertToNewModel(oldRecord);
  let accountP = newRecordP.then(({ AccountId }) => getAccount(AccountId));
  let serviceP = services.get({ ServiceName: oldRecord.Value.ServiceName });

  return Promise.join(accountP, newRecordP, serviceP,
    (account, record, svc) => Promise.resolve()
      .then(() => validate(oldRecord, svc))
      .then(rejectIfValidationFailed)
      .then(() => loadBalancerUpstreams.create({ record, metadata })))
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/config/upstreams',
          Method: 'POST',
          Parameters: [
            {
              Name: 'body',
              Type: 'body',
              Value: body || ''
            }
          ]
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: '_'
      }
    }))
    .catch(next);
}

/**
 * PUT /config/upstreams/{name}
 */
function putUpstreamConfigByName(req, res, next) {
  let body = param('body', req);
  let key = { key: param('name', req) };
  let expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);
  let oldRecord = flow(assign(key), omit('version'))({ Value: body });
  let newRecordP = convertToNewModel(oldRecord);
  let accountP = newRecordP.then(({ AccountId }) => getAccount(AccountId));
  let serviceP = services.get({ ServiceName: oldRecord.Value.ServiceName });

  return Promise.join(accountP, newRecordP, serviceP,
    (account, record, svc) => Promise.resolve()
      .then(() => validate(oldRecord, svc))
      .then(rejectIfValidationFailed)
      .then(() => loadBalancerUpstreams.replace({ record, metadata }, expectedVersion)))
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/upstreams/${param('name', req)}`,
          Method: 'PUT',
          Parameters: [
            {
              Name: 'name',
              Type: 'path',
              Value: (param('name', req)) || ''
            },
            {
              Name: 'body',
              Type: 'body',
              Value: body || ''
            }
          ]
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: `${JSON.stringify(key)}`
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/upstreams/{name}
 */
function deleteUpstreamConfigByName(req, res) {
  let Key = param('name', req);
  let key = { Key };
  const expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  return loadBalancerUpstreams.delete({ key, metadata }, expectedVersion)
    .then(() => res.status(200).end());
}

module.exports = {
  getUpstreamsConfig,
  getUpstreamConfigByName,
  postUpstreamsConfig,
  putUpstreamConfigByName,
  deleteUpstreamConfigByName
};


/***/ }),
/* 279 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let environments = __webpack_require__(18);
let environmentTypes = __webpack_require__(55);

function getEnvironmentType(environmentName) {
  let rejectIfNotFound = msg => obj => (obj !== null ? Promise.resolve(obj) : Promise.reject(new Error(msg)));
  return environments.get({ EnvironmentName: environmentName })
    .then(rejectIfNotFound(`Environment not found: ${environmentName}`))
    .then(({ Value: { EnvironmentType } }) => environmentTypes.get({ EnvironmentType })
      .then(rejectIfNotFound(`Environment Type not found: ${EnvironmentType}`)));
}

function convertToOldModel(model) {
  return {
    Audit: model.Audit,
    key: model.Key,
    Value: {
      EnvironmentName: model.Environment,
      Hosts: model.Hosts,
      LoadBalancingMethod: model.LoadBalancingMethod,
      PersistenceMethod: model.PersistenceMethod,
      SchemaVersion: model.SchemaVersion,
      ServiceName: model.Service,
      SlowStart: model.SlowStart,
      UpStreamKeepalives: model.UpStreamKeepalives,
      UpstreamName: model.Upstream,
      MarkForDelete: model.MarkForDelete,
      MarkForDeleteTimestamp: model.MarkForDeleteTimestamp,
      ZoneSize: model.ZoneSize
    }
  };
}

function convertToNewModel(model) {
  return Promise.resolve()
    .then(() => {
      if (model.__Deleted) { // eslint-disable-line no-underscore-dangle
        return {
          __Deleted: true,
          Audit: model.Audit,
          Key: model.key
        };
      } else {
        let environmentName = model.Value.EnvironmentName;
        return getEnvironmentType(environmentName)
          .then(environmentType => ({
            AccountId: environmentType.Value.AWSAccountNumber,
            Audit: model.Audit,
            Environment: environmentName,
            Hosts: model.Value.Hosts,
            Key: model.key,
            LoadBalancerGroup: environmentType.EnvironmentType,
            LoadBalancingMethod: model.Value.LoadBalancingMethod,
            PersistenceMethod: model.Value.PersistenceMethod,
            SchemaVersion: model.Value.SchemaVersion,
            Service: model.Value.ServiceName,
            SlowStart: model.Value.SlowStart,
            Upstream: model.Value.UpstreamName,
            UpStreamKeepalives: model.Value.UpStreamKeepalives,
            ZoneSize: model.Value.ZoneSize,
            MarkForDelete: model.Value.MarkForDelete,
            MarkForDeleteTimestamp: model.Value.MarkForDeleteTimestamp
          }));
      }
    });
}

module.exports = {
  convertToOldModel,
  convertToNewModel
};


/***/ }),
/* 280 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);

let valid = {
  isValid: true
};

let invalid = err => ({ isValid: false, err });

function validateDnsName(dnsName) {
  let consulMatch = /^[^\.]*?-[^\.]*$/.exec(dnsName);
  if (consulMatch) return valid;

  if (!_.includes(dnsName, '.')) {
    return invalid(`"${dnsName}" is not a valid as it contains no dots`);
  }

  let regex = /^([a-zA-Z0-9-]*?)\.(.*)$/;
  let matches = regex.exec(dnsName);

  if (!matches) {
    return invalid(`"${dnsName}" is not a valid as it contains illegal characters`);
  }

  let subDomain = matches[1];

  if (subDomain.startsWith('-') || subDomain.endsWith('-')) {
    return invalid(`"${dnsName}" is not valid as sub domains must not begin or end with a hyphen`);
  }

  let hyphensCount = (subDomain.match(/-/g) || []).length;
  if (hyphensCount > 3) return invalid(`"${dnsName}" is not valid as sub domains must not contain more than 3 hyphens`);

  return valid;
}

function validatePort(port, service) {
  let safePort = _.isNil(port) ? null : String(port);
  let safeBluePort = _.isNil(service.Value.BluePort) ? null : String(service.Value.BluePort);
  let safeGreenPort = _.isNil(service.Value.GreenPort) ? null : String(service.Value.GreenPort);

  if (safePort && safeBluePort && safeGreenPort) {
    if (safePort !== safeBluePort && safePort !== safeGreenPort) {
      let err = `Host port ${safePort} does not match blue or green port of ${service.ServiceName}`;
      return invalid(err);
    }
  }

  return valid;
}

exports.validate = (upstream, service) => {
  let hosts = upstream.Value.Hosts;

  if (hosts) {
    for (let host of hosts) {
      let dnsCheck = validateDnsName(host.DnsName);
      if (!dnsCheck.isValid) {
        return dnsCheck;
      }

      if (service) {
        let portCheck = validatePort(host.Port, service);
        if (!portCheck.isValid) {
          return portCheck;
        }
      }
    }
  }

  return valid;
};


/***/ }),
/* 281 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function InvalidItemSchemaError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 282 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let deploymentsHelper = __webpack_require__(113);
let GetNodeDeploymentLog = __webpack_require__(126);
let co = __webpack_require__(0);
let sender = __webpack_require__(6);
let Enums = __webpack_require__(11);
let activeDeploymentsStatusProvider = __webpack_require__(99);
let deploymentLogger = __webpack_require__(59);
const sns = __webpack_require__(12);
let { ifNotFound, notFoundMessage } = __webpack_require__(24);
const { toggleServiceStatus } = __webpack_require__(127);
let DeployService = __webpack_require__(284);

/**
 * GET /deployments
 */
function getDeployments(req, res, next) {
  const since = req.swagger.params.since.value;
  const environment = req.swagger.params.environment.value;
  const status = req.swagger.params.status.value;
  const cluster = req.swagger.params.cluster.value;

  deploymentsHelper.scan({
    since, environment, status, cluster
  }).then(data => res.json(data)).catch(next);
}

/**
 * GET /deployments/{key}
 */
function getDeploymentById(req, res, next) {
  const key = req.swagger.params.id.value;

  return deploymentsHelper.get({ key })
    .then(ifNotFound(notFoundMessage('deployment')))
    .then(send => send(res))
    .catch(next);
}

/**
 * GET /deployments/{id}/log
 */
function getDeploymentLog(req, res, next) {
  return co(function* () {
    const key = req.swagger.params.id.value;
    const accountName = req.swagger.params.account.value;
    const instanceId = req.swagger.params.instance.value;

    let deployment = yield deploymentsHelper.get({ key, account: accountName });
    let environment = deployment.Value.EnvironmentName;

    let query = {
      accountName,
      environment,
      deploymentId: key,
      instanceId
    };

    return GetNodeDeploymentLog(query).then((data) => {
      res.set('Content-Type', 'text/plain').send(data);
    });
  }).catch(next);
}

/**
 * POST /deployments
 */
function postDeployment(req, res, next) {
  const body = req.swagger.params.body.value;
  const environmentName = body.environment;
  const serviceName = body.service;
  const serviceVersion = body.version;
  const packagePath = body.packageLocation;
  const mode = body.mode || 'overwrite';
  const serviceSlice = body.slice || 'none';
  const serverRoleName = req.serverRoleName;
  const isDryRun = req.swagger.params.dry_run.value;

  let command = {
    name: 'DeployService',
    environmentName,
    serviceName,
    serviceVersion,
    serviceSlice,
    mode,
    packagePath,
    serverRoleName,
    isDryRun
  };

  if (packagePath) {
    let now = new Date().toUTCString();
    res.locals.deprecated = true;
    res.append('Warning', `299 - Package Location property is deprecated for deployments."${now}"`);
  }

  sender.sendCommand(DeployService, { command, user: req.user }).then((deployment) => {
    if (deployment.isDryRun) {
      res.status(200);
      res.json(deployment);
    } else {
      res.status(202);
      res.location(`/api/${deployment.accountName}/deployments/history/${deployment.id}`);
      res.json(deployment);
    }
  })
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/deployments',
          Method: 'POST'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.POST,
        ID: serviceName
      }
    }))
    .catch(next);
}

/**
 * PATCH /deployments/{key}
 */
function patchDeployment(req, res, next) {
  let key = null;
  return co(function* () {
    const body = req.swagger.params.body.value;
    key = req.swagger.params.id.value;
    let status = body.Status;
    let action = body.Action;

    if (status !== undefined && status !== Enums.DEPLOYMENT_STATUS.Cancelled) {
      let error = `You can only PATCH deployment with { Status: '${Enums.DEPLOYMENT_STATUS.Cancelled}' } to cancel it.`;
      res.send({ error });
      res.status(400);
      return null;
    }

    if (status === Enums.DEPLOYMENT_STATUS.Cancelled) {
      let deployment = yield deploymentsHelper.get({ key });
      if (deployment.Value.Status !== Enums.DEPLOYMENT_STATUS.InProgress) {
        throw new Error('You can only cancel deployments that are In Progress');
      }

      let newStatus = {
        name: Enums.DEPLOYMENT_STATUS.Cancelled,
        reason: `The deployment was cancelled manually by user: ${req.user.getName()}`
      };
      let deploymentStatuses = yield activeDeploymentsStatusProvider.getActiveDeploymentsFullStatus([deployment]);
      let deploymentStatus = deploymentStatuses[0];
      yield deploymentLogger.updateStatus(deploymentStatus, newStatus);
      return switchDeployment(key, false, req.user);
    } else if (action !== undefined) {
      let enable;
      if (action === Enums.ServiceAction.IGNORE) {
        enable = false;
      } else if (action === Enums.ServiceAction.INSTALL) {
        enable = true;
      } else {
        throw new Error(`Invalid Action: "${action}", only "Install" and "Ignore" are allowed.`);
      }
      return switchDeployment(key, enable, req.user);
    } else {
      return null;
    }
  })
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/deployments/${key}`,
          Method: 'PATCH'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: '',
        Action: sns.ACTIONS.PATCH,
        ID: key
      }
    })
    )
    .catch(next);
}

function switchDeployment(key, enable, user) {
  return deploymentsHelper.get({ key }).then((deployment) => {
    // Old deployments don't have 'ServerRoleName' and 'RuntimeServerRoleName' fields.
    // Unfortunately we are unable to determine these from existing data.
    if (deployment.Value.ServerRoleName === undefined || deployment.Value.RuntimeServerRoleName === undefined) {
      throw new Error('This operation is unsupported for Deployments started before 01.2017. If you would like to use this feature,'
        + 'please redeploy your service before trying again, or contact Platform Dev team.');
    }
    let serverRole = deployment.Value.RuntimeServerRoleName;
    let environment = deployment.Value.EnvironmentName;
    let slice = deployment.Value.ServiceSlice;
    let service = deployment.Value.ServiceName;

    return toggleServiceStatus({ environment, service, slice, enable, serverRole, user });
  });
}

module.exports = {
  getDeployments,
  getDeploymentById,
  getDeploymentLog,
  postDeployment,
  patchDeployment
};


/***/ }),
/* 283 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let serviceTargets = __webpack_require__(26);
let Enums = __webpack_require__(11);

const SERVICE_INSTALL = Enums.ServiceAction.INSTALL;
const SERVICE_IGNORE = Enums.ServiceAction.IGNORE;

function* ToggleTargetStatus(command) {
  let environment = command.environment;
  let serviceName = command.service;
  let serverRole = command.serverRole;
  let slice = command.slice;
  let enabled = command.enable;
  let key = `environments/${environment}/roles/${serverRole}/services/${serviceName}/${slice}`;
  let state = yield serviceTargets.getTargetState(environment, { key });
  let service = state.value;
  let previousStatus = service.Action || SERVICE_INSTALL;

  service.Action = enabled ? SERVICE_INSTALL : SERVICE_IGNORE;

  try {
    yield serviceTargets.setTargetState(environment, { key, value: service });
    return service;
  } catch (error) {
    throw new Error(
      `There was a problem updating the future installation status for ${serviceName}. Its status is still currently set to ${previousStatus}`);
  }
}

module.exports = co.wrap(ToggleTargetStatus);


/***/ }),
/* 284 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let Enums = __webpack_require__(11);
let DeploymentContract = __webpack_require__(285);
let sender = __webpack_require__(6);
let infrastructureConfigurationProvider = __webpack_require__(52);
let logger = __webpack_require__(2);
let namingConventionProvider = __webpack_require__(32);
const PackagePathProvider = __webpack_require__(289);
let deploymentLogger = __webpack_require__(59);
let _ = __webpack_require__(1);
let SupportedSliceNames = _.values(Enums.SliceName);
let SupportedDeploymentModes = _.values(Enums.DeploymentMode);
let s3PackageLocator = __webpack_require__(128);
let EnvironmentHelper = __webpack_require__(9);
let OpsEnvironment = __webpack_require__(130);
let ResourceLockedError = __webpack_require__(293);
let GetServicePortConfig = __webpack_require__(294);
let GetInfrastructureRequirements = __webpack_require__(295);
let PushDeployment = __webpack_require__(314);
let PreparePackage = __webpack_require__(320);
let ProvideInfrastructure = __webpack_require__(324);

let packagePathProvider = new PackagePathProvider();

module.exports = function DeployServiceCommandHandler(command) {
  return co(function* () {
    let deployment = yield validateCommandAndCreateDeployment(command);
    let destination = yield packagePathProvider.getS3Path(deployment);
    let sourcePackage = getSourcePackageByCommand(command);

    if (command.isDryRun) {
      return {
        isDryRun: true,
        packagePath: command.packagePath
      };
    }

    let accountName = deployment.accountName;
    yield deploymentLogger.started(deployment, accountName);
    // Run asynchronously, we don't wait for deploy to finish intentionally
    deploy(deployment, destination, sourcePackage, command);

    return deployment;
  });
};

function validateCommandAndCreateDeployment(command) {
  return co(function* () {
    const { mode, environmentName, serviceSlice, serviceName, serviceVersion } = command;

    if (mode === 'overwrite' && serviceSlice !== undefined && serviceSlice !== 'none') {
      throw new Error('Slice must be set to \'none\' in overwrite mode.');
    }
    if (SupportedDeploymentModes.indexOf(mode.toLowerCase()) < 0) {
      throw new Error(`Unknown mode \'${mode}\'. Supported modes are: ${SupportedDeploymentModes.join(', ')}`);
    }
    if (mode === 'bg' && SupportedSliceNames.indexOf(serviceSlice) < 0) {
      throw new Error(`Unknown slice \'${serviceSlice}\'. Supported slices are: ${SupportedSliceNames.join(', ')}`);
    }

    if (!command.packagePath) {
      let s3Package;
      try {
        s3Package = yield s3PackageLocator.findDownloadUrl({
          environment: environmentName,
          service: serviceName,
          version: serviceVersion
        });
      } catch (error) {
        throw new Error(`An attempt to locate the following package in S3 was forbidden: ${serviceName} version ${serviceVersion}`);
      }

      if (!s3Package) {
        throw new Error('Deployment package was not found. Please specify a location or upload the package to S3');
      } else {
        command.packagePath = s3Package;
      }
    }

    const environment = yield EnvironmentHelper.getByName(command.environmentName);
    const opsEnvironment = yield OpsEnvironment.getByName(command.environmentName);
    const environmentType = yield environment.getEnvironmentType();
    command.accountName = environmentType.AWSAccountName;
    const servicePortConfig = yield GetServicePortConfig(command.serviceName, command.serviceSlice);

    if (opsEnvironment.Value.DeploymentsLocked) {
      throw new ResourceLockedError(`The environment ${environmentName} is currently locked for deployments. Contact the environment owner.`);
    }

    let configuration = yield infrastructureConfigurationProvider.get(
      command.environmentName, command.serviceName, command.serverRoleName
    );

    let roleName = namingConventionProvider.getRoleName(configuration, command.serviceSlice);

    let deploymentContract = new DeploymentContract({
      id: command.commandId,
      environmentTypeName: configuration.environmentTypeName,
      environmentName: command.environmentName,
      serviceName: command.serviceName,
      serviceVersion: command.serviceVersion,
      serviceSlice: command.serviceSlice || '',
      servicePortConfig,
      serverRole: roleName,
      serverRoleName: command.serverRoleName,
      clusterName: configuration.cluster.Name,
      accountName: command.accountName,
      username: command.username
    });
    yield deploymentContract.validate(configuration);
    return deploymentContract;
  });
}

function deploy(deployment, destination, sourcePackage, command) {
  return co(function* () {
    const accountName = deployment.accountName;
    const requiredInfra = yield getInfrastructureRequirements(accountName, deployment, command);
    yield provideInfrastructure(accountName, requiredInfra, command);
    yield preparePackage(accountName, destination, sourcePackage, command);
    yield pushDeployment(accountName, requiredInfra, deployment, destination, command);

    deploymentLogger.inProgress(
      deployment.id,
      'Waiting for nodes to perform service deployment...'
    );
  }).catch((error) => {
    let deploymentStatus = {
      deploymentId: deployment.id,
      environmentName: deployment.environmentName,
      accountName: deployment.accountName
    };

    let newStatus = {
      name: Enums.DEPLOYMENT_STATUS.Failed,
      reason: sanitiseError(error)
    };

    return deploymentLogger.updateStatus(deploymentStatus, newStatus);
  }).catch(error => logger.error(error));
}

function sanitiseError(error) {
  if (_.isObjectLike(error) && !(error instanceof Error)) {
    return JSON.stringify(error);
  }
  return _.toString(error);
}

function getInfrastructureRequirements(accountName, deployment, parentCommand) {
  let command = {
    name: 'GetInfrastructureRequirements',
    accountName,
    deployment
  };

  return sender.sendCommand(GetInfrastructureRequirements, { command, parent: parentCommand });
}

function provideInfrastructure(accountName, requiredInfra, parentCommand) {
  let command = {
    name: 'ProvideInfrastructure',
    accountName,
    asgsToCreate: requiredInfra.asgsToCreate,
    launchConfigsToCreate: requiredInfra.launchConfigsToCreate
  };

  return sender.sendCommand(ProvideInfrastructure, { command, parent: parentCommand });
}

function preparePackage(accountName, destination, source, parentCommand) {
  let command = {
    name: 'PreparePackage',
    accountName,
    destination,
    source
  };

  return sender.sendCommand(PreparePackage, { command, parent: parentCommand });
}

function pushDeployment(accountName, requiredInfra, deployment, s3Path, parentCommand) {
  let command = {
    name: 'PushDeployment',
    accountName,
    deployment,
    s3Path,
    expectedNodeDeployments: requiredInfra.expectedInstances
  };

  return sender.sendCommand(PushDeployment, { command, parent: parentCommand });
}

function getSourcePackageByCommand(command) {
  return {
    url: command.packagePath
  };
}


/***/ }),
/* 285 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let deploymentValidators = __webpack_require__(286);
let _ = __webpack_require__(1);

class DeploymentContract {

  constructor(data) {
    _.assign(this, data);
  }

  validate(configuration) {
    // Checking deployment is valid through all validators otherwise return a rejected promise
    return deploymentValidators.map(validator => validator.validate(this, configuration));
  }

}


module.exports = DeploymentContract;


/***/ }),
/* 286 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const blueGreenDeploymentValidator = __webpack_require__(287);
const uniqueServiceVersionDeploymentValidator = __webpack_require__(288);

let validators = [
  blueGreenDeploymentValidator,
  uniqueServiceVersionDeploymentValidator
];

module.exports = validators;


/***/ }),
/* 287 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let Enums = __webpack_require__(11);
let DeploymentValidationError = __webpack_require__(84);
const SupportedSliceNames = _.values(Enums.SliceName);

module.exports = {
  validate(deployment, configuration) {
    if (configuration.serverRole.FleetPerSlice !== true) return Promise.resolve();
    if (SupportedSliceNames.indexOf(deployment.serviceSlice) >= 0) return Promise.resolve();

    return Promise.reject(new DeploymentValidationError(
      `${'Server role configuration expects two AutoScalingGroups ' +
      `for '${deployment.serviceName}' blue/green slices ` +
      'but current deployment slice is '}${
      deployment.serviceSlice ? `'${deployment.serviceSlice}'.` : 'empty.'}`
    ));
  }
};


/***/ }),
/* 288 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let deployments = __webpack_require__(35);
let DeploymentValidationError = __webpack_require__(84);

function validateServiceNotCurrentlyBeingDeployed(deployment) {
  let expectedStatus = 'In Progress';
  let query = {
    FilterExpression: ['and',
      ['=', ['at', 'Value', 'EnvironmentName'], ['val', deployment.environmentName]],
      ['=', ['at', 'Value', 'SchemaVersion'], ['val', 2]],
      ['=', ['at', 'Value', 'ServiceName'], ['val', deployment.serviceName]],
      ['=', ['at', 'Value', 'Status'], ['val', expectedStatus]]
    ]
  };

  return deployments.scanRunning(query).then((results) => {
    if (results.length) {
      let { serviceName: service, serverRoleName: role } = deployment;
      return Promise.reject(new DeploymentValidationError(
        `The '${service}' service is already being deployed to '${role}' at this time.`
      ));
    }

    return Promise.resolve();
  });
}

module.exports = {
  validate(deployment) {
    return Promise.all([
      validateServiceNotCurrentlyBeingDeployed(deployment)
    ]);
  }
};


/***/ }),
/* 289 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let S3PathContract = __webpack_require__(290);
let configCache = __webpack_require__(57);

module.exports = function PackagePathProvider() {
  this.getS3Path = function (deployment) {
    return configCache
      .getEnvironmentTypeByName(deployment.environmentTypeName)
      .then((environmentType) => {
        let filePath = `${deployment.environmentName}/${deployment.serviceName}`;
        let fileName = `${deployment.serviceName}-${deployment.serviceVersion}.zip`;

        return Promise.resolve(new S3PathContract({
          bucket: environmentType.DeploymentBucket,
          key: `${filePath}/${fileName}`
        }));
      });
  };
};


/***/ }),
/* 290 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



module.exports = function S3PathContract(options) {
  this.bucket = options.bucket;
  this.key = options.key;
  this.getType = () => this.constructor.name;
};


/***/ }),
/* 291 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let later = __webpack_require__(132);

const cronActions = {
  start: 'on',
  stop: 'off'
};

function tryParseSchedule(serialisedSchedule) {
  try {
    return parseSchedule(serialisedSchedule);
  } catch (err) {
    return invalid(err);
  }
}

function parseSchedule(serialisedSchedule) {
  let schedule = serialisedSchedule.trim().toLowerCase();

  if (schedule === 'noschedule') { return skip(); }

  if (['on', '247', 'off'].some(x => x === schedule)) {
    return permanent(schedule);
  }

  let parseResult = tryParseCronSchedule(schedule);

  if (!parseResult.success) {
    return invalid(`Could not parse cron schedule - Error: '${parseResult.error}'`);
  }

  return parseResult;
}

function tryParseCronSchedule(serialisedCronSchedule) {
  try {
    return parseCronSchedule(serialisedCronSchedule);
  } catch (err) {
    return { success: false, error: err };
  }
}

function parseCronSchedule(serialisedCronSchedule) {
  let [serializedSchedule, timezone] = serialisedCronSchedule.split('|');
  if (timezone) timezone = timezone.trim();

  let schedule = serializedSchedule.split(';').map((item) => {
    let parts = item.split(':');
    let state = (cronActions[parts[0].trim()] || parts[0].trim());

    if (state === undefined || state === '' || parts[1] === undefined || parts[1].trim() === '') {
      throw new Error('Invalid cron action');
    }

    let recurrence = later.parse.cron(parts[1].trim());
    return { state, recurrence };
  });

  return {
    success: true,
    schedule,
    timezone
  };
}

function permanent(schedule) {
  let state = schedule === 'off' ? 'off' : 'on';
  return { success: true, schedule: { permanent: state } };
}

function invalid(err) {
  return { success: false, error: err };
}

function skip() {
  return { success: true, schedule: { skip: true } };
}

module.exports = tryParseSchedule;


/***/ }),
/* 292 */
/***/ (function(module, exports) {

module.exports = require("moment-timezone");

/***/ }),
/* 293 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function ResourceLockedError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 294 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let Service = __webpack_require__(116);
let _ = __webpack_require__(1);

const DEFAULT_PORT = 0;

const getPort = (service, colour) => _.get(service, ['Value', `${colour}Port`]);

function intOrDefault(maybePort) {
  let port = Number(maybePort);
  return Number.isInteger(port) ? port : DEFAULT_PORT;
}

function getServicePortConfig(serviceName) {
  let portConfig = { blue: DEFAULT_PORT, green: DEFAULT_PORT };

  if (serviceName === undefined || serviceName === '') {
    return Promise.resolve(portConfig);
  }

  return Service.getByName(serviceName.trim())
    .then(service => ({
      blue: intOrDefault(getPort(service, 'Blue')),
      green: intOrDefault(getPort(service, 'Green'))
    }));
}

module.exports = getServicePortConfig;


/***/ }),
/* 295 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let DeploymentCommandHandlerLogger = __webpack_require__(39);
let DeploymentValidationError = __webpack_require__(84);
let launchConfigurationTemplatesProvider = __webpack_require__(296);
let configProvider = __webpack_require__(52);
let asgTemplatesProvider = __webpack_require__(306);
let namingConvention = __webpack_require__(32);
let sender = __webpack_require__(6);
let getASG = __webpack_require__(56);
let _ = __webpack_require__(1);
let ScanAutoScalingGroups = __webpack_require__(61);
let ScanLaunchConfigurations = __webpack_require__(313);

module.exports = function GetInfrastructureRequirements(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  return co(function* () {
    let deployment = command.deployment;
    let environmentName = deployment.environmentName;
    let serviceName = deployment.serviceName;
    let accountName = deployment.accountName;
    let slice = deployment.serviceSlice;
    let requiredInfra = { asgsToCreate: [], launchConfigsToCreate: [], expectedInstances: 0 };

    logger.info('Reading infrastructure configuration...');

    let configuration = yield configProvider.get(environmentName, serviceName, deployment.serverRoleName);
    let asgsToCreate = yield getASGsToCreate(logger, configuration, accountName, slice);
    requiredInfra.expectedInstances = yield getExpectedNumberOfInstances(accountName, configuration, asgsToCreate, slice);

    if (!asgsToCreate.length) return requiredInfra;
    let launchConfigsToCreate = yield getLaunchConfigsToCreate(logger, configuration, asgsToCreate, accountName);

    // Check launchConfigs are valid
    launchConfigsToCreate.forEach((template) => {
      let minVolumeSize = template.image.rootVolumeSize;
      let osBlockDeviceMapping = _.find(template.devices, d => _.includes(['/dev/sda1', '/dev/xvda'], d.DeviceName));
      let instanceVolumeSize = osBlockDeviceMapping.Ebs.VolumeSize;
      if (instanceVolumeSize < minVolumeSize) {
        throw new DeploymentValidationError(`Cannot create Launch Configuration. The specified OS volume size (${instanceVolumeSize} GB) is not sufficient for image '${template.image.name}' (${minVolumeSize} GB). Please check your deployment map settings.`);
      }
    });

    requiredInfra.asgsToCreate = asgsToCreate;
    requiredInfra.launchConfigsToCreate = launchConfigsToCreate;
    return requiredInfra;
  }).catch((error) => {
    logger.error('An error has occurred while determining the required infrastructure', error);
    return Promise.reject(error);
  });
};

function getExpectedNumberOfInstances(accountName, config, slice, asgsToCreate) {
  return co(function* () {
    if (asgsToCreate.length) {
      // ASG does not exist yet, get desired size from server role
      return config.serverRole.AutoScalingSettings.DesiredCapacity;
    } else {
      // ASG exists, read current desired size
      let autoScalingGroupName = namingConvention.getAutoScalingGroupName(config, slice);
      return getASG({ accountName, autoScalingGroupName }).then(data => data.DesiredCapacity);
    }
  });
}

function getASGsToCreate(logger, configuration, accountName, slice) {
  return co(function* () {
    let autoScalingTemplates = yield asgTemplatesProvider.get(configuration, accountName);
    let autoScalingGroupNames = autoScalingTemplates
      .map(template => template.autoScalingGroupName)
      .filter((asgName) => {
        // Only create ASGs On Demand
        return slice === 'none' ||                                        // Always create ASG in overwrite mode
            configuration.serverRole.FleetPerSlice === undefined ||       // Always create ASG if FleetPerSlice not known
            configuration.serverRole.FleetPerSlice === false ||           // Always create ASG in single ASG mode
            asgName.endsWith(`-${slice}`);                                // Create ASG if it's the target slice
      });

    let autoScalingGroupNamesToCreate = yield getASGNamesToCreate(logger, autoScalingGroupNames, accountName);
    return autoScalingTemplates.filter(template =>
      autoScalingGroupNamesToCreate.indexOf(template.autoScalingGroupName) >= 0
    );
  });
}

function getASGNamesToCreate(logger, autoScalingGroupNames, accountName) {
  return co(function* () {
    logger.info(`Following AutoScalingGroups are expected: [${autoScalingGroupNames.join(', ')}]`);
    let query = {
      name: 'ScanAutoScalingGroups',
      accountName,
      autoScalingGroupNames
    };

    let autoScalingGroups = yield sender.sendQuery(ScanAutoScalingGroups, { query });
    let existingASGnames = autoScalingGroups.map(group =>
      group.AutoScalingGroupName
    );
    if (existingASGnames.length) {
      logger.info(`Following AutoScalingGroups already exist: [${existingASGnames.join(', ')}]`);
    }

    let missingASGnames = autoScalingGroupNames.filter(name =>
      existingASGnames.indexOf(name) < 0
    );
    if (missingASGnames.length) {
      logger.info(`Following AutoScalingGroups have to be created: [${missingASGnames.join(', ')}]`);
    } else {
      logger.info('No AutoScalingGroup has to be created');
    }

    return missingASGnames;
  });
}

function getLaunchConfigsToCreate(logger, configuration, autoScalingTemplates, accountName) {
  return co(function* () {
    let launchConfigurationNames = autoScalingTemplates.map(template =>
      template.launchConfigurationName
    );

    let launchConfigurationNamesToCreate = yield getLaunchConfigNamesToCreate(
      logger, launchConfigurationNames, accountName
    );
    if (!launchConfigurationNamesToCreate.length) {
      return [];
    }
    let launchConfigurationTemplates = yield launchConfigurationTemplatesProvider.get(
      configuration, accountName, logger
    );

    return launchConfigurationTemplates.filter(template =>
      launchConfigurationNamesToCreate.indexOf(template.launchConfigurationName) >= 0
    );
  });
}

function getLaunchConfigNamesToCreate(logger, launchConfigurationNames, accountName) {
  return co(function* () {
    logger.info(`Following LaunchConfigurations are expected: [${launchConfigurationNames.join(', ')}]`);
    let query = {
      name: 'ScanLaunchConfigurations',
      accountName,
      launchConfigurationNames
    };

    let launchConfigurations = yield sender.sendQuery(ScanLaunchConfigurations, { query });
    let existingLaunchConfigurationNames = launchConfigurations.map(config =>
      config.LaunchConfigurationName
    );
    if (existingLaunchConfigurationNames.length) {
      logger.info(`Following LaunchConfigurations already exist: [${existingLaunchConfigurationNames.join(', ')}]`);
    }

    let missingLaunchConfigurationNames = launchConfigurationNames.filter(name =>
      existingLaunchConfigurationNames.indexOf(name) < 0
    );
    if (missingLaunchConfigurationNames.length) {
      logger.info(`Following LaunchConfigurations have to be created: [${missingLaunchConfigurationNames.join(', ')}]`);
    } else {
      logger.info('No LaunchConfiguration has to be created');
    }

    return missingLaunchConfigurationNames;
  });
}


/***/ }),
/* 296 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let co = __webpack_require__(0);

let namingConventionProvider = __webpack_require__(32);
let iamInstanceProfileNameProvider = __webpack_require__(297);
let instanceDevicesProvider = __webpack_require__(81);
let securityGroupsProvider = __webpack_require__(120);
let userDataProvider = __webpack_require__(298);
let keyNameProvider = __webpack_require__(302);
let imageProvider = __webpack_require__(74);

module.exports = {
  get(configuration, accountName, logger) {
    assert(configuration, 'Expected \'configuration\' argument not to be null.');
    assert(accountName, 'Expected \'accountName\' argument not to be null.');

    return co(function* () {
      let sliceNames = configuration.serverRole.FleetPerSlice ? ['blue', 'green'] : [null];

      let image = yield imageProvider.get(configuration.serverRole.AMI);
      let keyName = yield keyNameProvider.get(configuration, accountName);
      let iamInstanceProfile = yield iamInstanceProfileNameProvider.get(configuration, accountName);
      let securityGroups = yield securityGroupsProvider.getFromConfiguration(configuration, image, accountName, logger);
      let devices = instanceDevicesProvider.toAWS(configuration.serverRole.Volumes);
      let detailedMonitoring = isDetailedMonitoringEnabled(configuration);
      let templates = [];

      for (let index = 0; index < sliceNames.length; index++) {
        let sliceName = sliceNames[index];
        let userData = yield userDataProvider.get(configuration, image, sliceName);
        let launchConfigurationName = namingConventionProvider.getLaunchConfigurationName(
          configuration, sliceName
        );
        let instanceType = configuration.serverRole.InstanceType;

        templates.push({
          launchConfigurationName,
          image,
          instanceType,
          keyName,
          detailedMonitoring,
          iamInstanceProfile,
          securityGroups,
          devices,
          userData
        });
      }

      return templates;
    });
  }
};

function isDetailedMonitoringEnabled(configuration) {
  let environmentTypeName = (configuration.environmentTypeName || '').toLowerCase();
  let detailedMonitoringEnabled = environmentTypeName === 'prod';
  return detailedMonitoringEnabled;
}


/***/ }),
/* 297 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let ConfigurationError = __webpack_require__(36);
let sender = __webpack_require__(6);
let GetInstanceProfile = __webpack_require__(121);

module.exports = {
  get(configuration, accountName) {
    assert(configuration, 'Expected "configuration" argument not to be null');
    assert(accountName, 'Expected "accountName" argument not to be null');

    let customInstanceProfileName = configuration.serverRole.InstanceProfileName;
    if (customInstanceProfileName) {
      return getInstanceProfileByName(customInstanceProfileName, accountName)
        .then(
          instanceProfile => Promise.resolve(instanceProfile.InstanceProfileName),
          error => Promise.reject(new ConfigurationError(
            `An error has occurred verifying "${customInstanceProfileName}" instance profile specified in configuration.`,
            error))
        );
    } else {
      let instanceProfileName = getInstanceProfileNameByConvention(configuration);
      return getInstanceProfileByName(instanceProfileName, accountName)
        .then(
          instanceProfile => Promise.resolve(instanceProfile.InstanceProfileName),
          error => Promise.reject(new ConfigurationError(
            `An error has occurred verifying "${instanceProfileName}" instance profile defined by convention. ` +
            'If needed a different one can be specified in configuration.',
            error))
        );
    }
  }
};

function getInstanceProfileNameByConvention(configuration) {
  let serverRoleName = configuration.serverRole.ServerRoleName;
  let clusterName = configuration.cluster.Name;
  let instanceProfileName = `role${clusterName}${serverRoleName}`;

  return instanceProfileName;
}

function getInstanceProfileByName(instanceProfileName, accountName) {
  let query = {
    name: 'GetInstanceProfile',
    accountName,
    instanceProfileName
  };

  return sender.sendQuery(GetInstanceProfile, { query });
}


/***/ }),
/* 298 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let namingConventionProvider = __webpack_require__(32);
let userDataBuilder = __webpack_require__(299);

module.exports = {
  get(configuration, image, sliceName) {
    assert(configuration, 'Expected \'configuration\' argument not to be null');
    assert(image, 'Expected \'image\' argument not to be null');

    let userData = image.platform === 'Windows' ?
      getWindowsUserData(configuration, sliceName) :
      getLinuxUserData(configuration, sliceName);
    return userData;
  }
};

function getLinuxUserData(configuration, sliceName) {
  let roleName = namingConventionProvider.getRoleName(configuration, sliceName);
  let parameters = {
    EnvironmentType: configuration.environmentTypeName,
    Environment: configuration.environmentName,
    SecurityZone: configuration.serverRole.SecurityZone,
    OwningCluster: configuration.cluster.Name,
    Role: roleName,
    ContactEmail: configuration.serverRole.ContactEmailTag,
    ProjectCode: configuration.serverRole.ProjectCodeTag,
    PuppetRole: configuration.serverRole.PuppetRole
  };

  return userDataBuilder.buildLinuxUserData(parameters);
}

function getWindowsUserData(configuration, sliceName) {
  let roleName = namingConventionProvider.getRoleName(configuration, sliceName);
  let parameters = {
    EnvironmentType: configuration.environmentTypeName,
    Environment: configuration.environmentName,
    SecurityZone: configuration.serverRole.SecurityZone,
    OwningCluster: configuration.cluster.Name,
    Role: roleName,
    ContactEmail: configuration.serverRole.ContactEmailTag,
    ProjectCode: configuration.serverRole.ProjectCodeTag,
    RemovalDate: configuration.serverRole.RemovalDateTag,
    PuppetRole: configuration.serverRole.PuppetRole
  };

  return userDataBuilder.buildWindowsUserData(parameters);
}


/***/ }),
/* 299 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let base64 = __webpack_require__(123);
let { createUserData: createLinuxUserData } = __webpack_require__(300);
let { createUserData: createWindowsUserData } = __webpack_require__(301);

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


/***/ }),
/* 300 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function createUserData({ ContactEmail, Environment, EnvironmentType, OwningCluster, ProjectCode, PuppetRole, Role, SecurityZone, }) {
    return `#!/bin/bash -xe
/etc/puppet/tools/machine_boot -t name=,environmenttype=${EnvironmentType},environment=${Environment},securityzone=${SecurityZone},owningcluster=${OwningCluster},role=${Role},contactemail=${ContactEmail},projectcode=${ProjectCode} ${PuppetRole} > /tmp/machine_boot.log`; // tslint:disable-line max-line-length
}
exports.createUserData = createUserData;


/***/ }),
/* 301 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function createUserData({ ContactEmail, Environment, EnvironmentType, OwningCluster, ProjectCode, PuppetRole, RemovalDate, Role, SecurityZone, }) {
    return `<powershell>
if(test-path "C:\TTLApps\ttl-appbootstrapper\configure.ps1"){
	Powershell.exe -executionpolicy remotesigned -File C:\TTLApps\ttl-appbootstrapper\configure.ps1
} else {
	Powershell.exe -executionpolicy remotesigned -File C:\TTLApps\initial-boot.ps1
}
</powershell>
##Creator:${ContactEmail}
##Environment:${Environment}
##Owner:${OwningCluster}
##Role:${Role}
##PuppetRole:${PuppetRole}
##DeploymentMaps:[]
##OwningCluster:${OwningCluster}
##EnvironmentType:${EnvironmentType}
##SecurityZone:${SecurityZone}
##ContactEmail:${ContactEmail}
##ProjectCode:${ProjectCode}
##RemovalDate:${RemovalDate}`;
}
exports.createUserData = createUserData;


/***/ }),
/* 302 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let sender = __webpack_require__(6);
let GetKeyPair = __webpack_require__(303);
let ConfigurationError = __webpack_require__(36);

module.exports = {
  get(configuration, accountName) {
    assert(configuration, 'Expected "configuration" argument not to be null');
    assert(accountName, 'Expected "accountName" argument not to be null');

    let customKeyName = configuration.serverRole.ClusterKeyName;
    if (customKeyName) {
      return getKeyPairByName(customKeyName, accountName)
        .then(
          keyPair => Promise.resolve(keyPair.KeyName),
          error => Promise.reject(new ConfigurationError(
            `An error has occurred verifying "${customKeyName}" key pair specified in configuration.`,
            error))
        );
    } else {
      let keyName = configuration.cluster.KeyPair;
      if (keyName === '' || keyName === undefined || keyName === null) {
        return Promise.reject(
          new ConfigurationError('Server role EC2 key pair set to cluster EC2 key pair, but this is empty. Please fix your configuration'));
      }

      return getKeyPairByName(keyName, accountName)
        .then(
          keyPair => Promise.resolve(keyPair.KeyName),
          error => Promise.reject(new ConfigurationError(
            `An error has occurred verifying "${keyName}" key pair defined by convention. ` +
            'If needed a different one can be specified in configuration.',
            error))
        );
    }
  }
};

function getKeyPairByName(keyName, accountName) {
  let query = {
    name: 'GetKeyPair',
    accountName,
    keyName
  };

  return sender.sendQuery(GetKeyPair, { query });
}


/***/ }),
/* 303 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let keypairFactory = __webpack_require__(304);

module.exports = function GetKeyPairQueryHandler({ accountName, keyName }) {
  assert(accountName);
  assert(keyName);

  let parameters = { accountName };
  return keypairFactory.create(parameters)
    .then(resource => resource.get({ keyName }));
};


/***/ }),
/* 304 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const amazonClientFactory = __webpack_require__(14);

const AwsError = __webpack_require__(33);
const KeyPairNotFoundError = __webpack_require__(305);

class KeyPairResource {

  constructor(client) {
    this.client = client;
  }

  get({ keyName }) {
    let self = this;
    let request = {
      KeyNames: [keyName]
    };

    return self.client.describeKeyPairs(request).promise().then((response) => {
      if (response.KeyPairs.length) {
        return response.KeyPairs[0];
      } else {
        throw new KeyPairNotFoundError(`Key pair "${keyName}" not found.`);
      }
    }, (error) => {
      throw new AwsError(`An error has occurred describing EC2 key pairs: ${error.message}`);
    });
  }
}

module.exports = {
  create: parameters => amazonClientFactory.createEC2Client(parameters.accountName).then(client => new KeyPairResource(client))
};


/***/ }),
/* 305 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function KeyPairNotFoundError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 306 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let co = __webpack_require__(0);
let topicNotificationMappingProvider = __webpack_require__(307);
let namingConventionProvider = __webpack_require__(32);
let subnetsProvider = __webpack_require__(122);
let tagsProvider = __webpack_require__(312);

module.exports = {
  get(configuration, accountName) {
    assert(configuration, 'Expected \'configuration\' argument not to be null.');

    return co(function* () {
      let sliceNames = configuration.serverRole.FleetPerSlice ? ['blue', 'green'] : [null];
      let topicNotificationMapping = yield topicNotificationMappingProvider.get(accountName);
      let subnets = yield subnetsProvider.get(configuration);
      let templates = [];

      for (let index = 0; index < sliceNames.length; index++) {
        let sliceName = sliceNames[index];

        let autoScalingGroupName = namingConventionProvider.getAutoScalingGroupName(
          configuration, sliceName
        );

        let launchConfigurationName = namingConventionProvider.getLaunchConfigurationName(
          configuration, sliceName
        );

        let tags = yield tagsProvider.get(configuration, sliceName);

        templates.push({
          autoScalingGroupName,
          launchConfigurationName,
          size: {
            min: configuration.serverRole.AutoScalingSettings.MinCapacity,
            desired: configuration.serverRole.AutoScalingSettings.DesiredCapacity,
            max: configuration.serverRole.AutoScalingSettings.MaxCapacity
          },
          scaling: {
            terminationDelay: configuration.serverRole.TerminationDelay
          },
          subnets,
          tags,
          topicNotificationMapping
        });
      }

      return templates;
    });
  }
};


/***/ }),
/* 307 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let AutoScalingNotificationType = __webpack_require__(11).AutoScalingNotificationType;
let sender = __webpack_require__(6);
let GetTopic = __webpack_require__(308);

const TopicsToNotify = [
  'InfraAsgLambdaScale'
];

module.exports = {
  get(accountName) {
    let mappings = TopicsToNotify.map(topicName =>
      getMappingsByTopicName(topicName, accountName)
    );

    return Promise.all(mappings);
  }
};

function getMappingsByTopicName(topicName, accountName) {
  return getTopicByName(topicName, accountName).then((topic) => {
    let mapping = {
      topicName,
      topicArn: topic.TopicArn,
      notificationTypes: [
        AutoScalingNotificationType.InstanceLaunch,
        AutoScalingNotificationType.InstanceLaunchError,
        AutoScalingNotificationType.InstanceTerminate,
        AutoScalingNotificationType.InstanceTerminateError
      ]
    };
    return Promise.resolve(mapping);
  });
}

function getTopicByName(topicName, accountName) {
  let query = {
    name: 'GetTopic',
    accountName,
    topicName
  };

  return sender.sendQuery(GetTopic, { query });
}


/***/ }),
/* 308 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let snsTopicClientFactory = __webpack_require__(309);

module.exports = function GetTopicQueryHandler(query) {
  return snsTopicClientFactory
    .create({ accountName: query.accountName })
    .then(client => client.get({ topicName: query.topicName }));
};


/***/ }),
/* 309 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let SNSTopicClient = __webpack_require__(310);

module.exports = {
  create(parameters) {
    return new Promise((resolve) => {
      let client = new SNSTopicClient(parameters.accountName);
      resolve(client);
    });
  }
};


/***/ }),
/* 310 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let _ = __webpack_require__(1);
let AwsError = __webpack_require__(33);
let TopicNotFoundError = __webpack_require__(311);
let config = __webpack_require__(5);
let awsAccounts = __webpack_require__(31);
let amazonClientFactory = __webpack_require__(14);

const AWS_REGION = config.get('EM_AWS_REGION');

module.exports = function SNSTopicClient(accountName) {
  this.get = function (parameters) {
    return co(function* () {
      let awsAccount = yield awsAccounts.getByName(accountName);
      let topicArn = yield getTopicArnByConvention(parameters.topicName, awsAccount);
      let client = yield amazonClientFactory.createSNSClient(accountName);
      let topic = yield client.getTopicAttributes({ TopicArn: topicArn }).promise().then(
        response => Promise.resolve(response.Attributes),
        error => Promise.reject(error.code === 'NotFound' ?
          new TopicNotFoundError(`Topic '${parameters.topicName}' not found.`)
          : new AwsError(error.message))
      );
      return topic;
    });
  };

  function getTopicArnByConvention(topicName, awsAccount) {
    let accountNumber = _.padStart(awsAccount.AccountNumber, 12, '0');
    let topicArn = `arn:aws:sns:${AWS_REGION}:${accountNumber}:${topicName}`;
    return Promise.resolve(topicArn);
  }
};


/***/ }),
/* 311 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function TopicNotFoundError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 312 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let namingConventionProvider = __webpack_require__(32);
let ConfigurationError = __webpack_require__(36);

module.exports = {
  get(configuration, sliceName) {
    assert(configuration, 'Expected \'configuration\' argument not to be null');
    let roleName = namingConventionProvider.getRoleName(configuration, sliceName);
    let legacyTags = {
      OwningCluster: configuration.cluster.Name,
      OwningClusterShortName: configuration.cluster.ShortName
    };
    let tags = {
      EnvironmentType: configuration.environmentTypeName,
      Environment: configuration.environmentName,
      OwningTeam: configuration.cluster.Name,
      Role: roleName,
      SecurityZone: configuration.serverRole.SecurityZone,
      Schedule: configuration.serverRole.ScheduleTag || '',
      ContactEmail: configuration.serverRole.ContactEmailTag
    };

    if (!tags.ContactEmail) {
      return Promise.reject(new ConfigurationError('Missing \'ContactEmail\' tag in configuration.'));
    }

    return Promise.resolve(Object.assign({}, legacyTags, tags));
  }
};


/***/ }),
/* 313 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const launchConfigurationResourceFactory = __webpack_require__(58);
let co = __webpack_require__(0);

function* handler(query) {
  // Create an instance of the resource to work with based on the resource
  // descriptor and AWS account name.
  let parameters = { accountName: query.accountName };
  let resource = yield launchConfigurationResourceFactory.create('launchconfig', parameters);

  // Scan resource items
  return resource.all({ names: query.launchConfigurationNames });
}

module.exports = co.wrap(handler);


/***/ }),
/* 314 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let DeploymentCommandHandlerLogger = __webpack_require__(39);
let sender = __webpack_require__(6);
let consulClient = __webpack_require__(44);
let serverRoleProvider = __webpack_require__(315);
let serviceInstallationProvider = __webpack_require__(316);
let serviceDefinitionProvider = __webpack_require__(317);
let serviceDeploymentProvider = __webpack_require__(318);
let deploymentDefinitionProvider = __webpack_require__(319);
let UpdateTargetState = __webpack_require__(112);

module.exports = function PushDeploymentCommandHandler(command) {
  const logger = new DeploymentCommandHandlerLogger(command);
  const deployment = command.deployment;
  const s3Path = command.s3Path;
  const expectedNodeDeployments = command.expectedNodeDeployments;

  return co(function* () {
    let consulConfig = yield consulClient.createConfig({ environment: deployment.environmentName });
    let dataCentre = consulConfig.defaults.dc;

    logger.info(`Updating consul metadata in data centre "${dataCentre}"`);

    let serviceDefinition = yield serviceDefinitionProvider.getKeyValue(deployment);
    let serverRoleDefinition = yield serverRoleProvider.getKeyValue(deployment);
    let serviceInstallation = yield serviceInstallationProvider.getKeyValue(deployment, s3Path);
    let deploymentDefinition = yield deploymentDefinitionProvider.getKeyValue(deployment);
    let serviceDeploymentDefinition = yield serviceDeploymentProvider.getKeyValue(deployment, expectedNodeDeployments);

    yield [
      updateTargetState(command, serviceDefinition),
      updateTargetState(command, serverRoleDefinition),
      updateTargetState(command, serviceInstallation),
      updateTargetState(command, deploymentDefinition),
      updateTargetState(command, serviceDeploymentDefinition)
    ];

    logger.info('Consul metadata has been updated');
  }).catch((error) => {
    logger.error('An error has occurred updating consul metadata', error);
    return Promise.reject(error);
  });
};

function updateTargetState(command, keyValue, options) {
  return sender.sendCommand(UpdateTargetState, {
    command: {
      name: 'UpdateTargetState',
      deploymentId: command.deployment.id,
      environment: command.deployment.environmentName,
      key: keyValue.key,
      value: keyValue.value,
      options
    },
    parent: command
  });
}


/***/ }),
/* 315 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let Enums = __webpack_require__(11);

function getKeyValue(deployment) {
  let deploymentId = deployment.id;
  let environmentName = deployment.environmentName;
  let serviceName = deployment.serviceName;
  let serviceVersion = deployment.serviceVersion;
  let serviceSlice = deployment.serviceSlice;
  let serverRole = deployment.serverRole;

  let key = serviceSlice ?
    `environments/${environmentName}/roles/${serverRole}/services/${serviceName}/${serviceSlice}` :
    `environments/${environmentName}/roles/${serverRole}/services/${serviceName}`;

  let serverRoleDefinitionKeyValue = {
    key,
    value: {
      Name: serviceName,
      Version: serviceVersion,
      Slice: serviceSlice || 'none',
      DeploymentId: deploymentId,
      InstanceIds: [],
      Action: Enums.ServiceAction.INSTALL
    }
  };

  return Promise.resolve(serverRoleDefinitionKeyValue);
}

module.exports = {
  getKeyValue
};


/***/ }),
/* 316 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



function getKeyValue(deployment, s3Path) {
  let environmentName = deployment.environmentName;
  let serviceName = deployment.serviceName;
  let serviceVersion = deployment.serviceVersion;

  let serviceInstallationKeyValue = {
    key: `environments/${environmentName}/services/${serviceName}/${serviceVersion}/installation`,
    value: {
      PackageBucket: s3Path.bucket,
      PackageKey: s3Path.key,
      InstallationTimeout: 20 // Todo: Should be read from the service definition
    }
  };

  return Promise.resolve(serviceInstallationKeyValue);
}

module.exports = {
  getKeyValue
};


/***/ }),
/* 317 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



function getKeyValue(deployment) {
  let environmentName = deployment.environmentName;
  let environmentTypeName = deployment.environmentTypeName;
  let serviceName = deployment.serviceName;
  let serviceVersion = deployment.serviceVersion;
  let serviceSlice = deployment.serviceSlice;
  let clusterName = deployment.clusterName;
  let serviceId = getServiceId(environmentName, serviceName, serviceSlice);
  let servicePorts = deployment.servicePortConfig;
  let serviceDefinitionKeyValue = {
    key: `environments/${environmentName}/services/${serviceName}/${serviceVersion}/definition`,
    value: {
      Service: {
        Name: serviceId,
        ID: serviceId,
        Address: '',
        Ports: servicePorts,
        Tags: [
          `environment_type:${environmentTypeName}`,
          `environment:${environmentName}`,
          `owning_cluster:${clusterName}`,
          `version:${serviceVersion}`
          // server_role and slice tags are set by Consul deployment agent
        ]
      }
    }
  };

  return Promise.resolve(serviceDefinitionKeyValue);
}

function getServiceId(environmentName, serviceName, serviceSlice) {
  return [
    environmentName,
    serviceName,
    serviceSlice !== 'none' ? serviceSlice : null
  ].filter(segment => !!segment).join('-');
}

module.exports = {
  getKeyValue
};


/***/ }),
/* 318 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



function getKeyValue(deployment, expectedNodeDeployments) {
  let environmentName = deployment.environmentName;
  let serviceName = deployment.serviceName;
  let serviceVersion = deployment.serviceVersion;
  let deploymentId = deployment.id;

  let deploymentServiceKeyValue = {
    key: `deployments/${deploymentId}/service`,
    value: {
      Name: serviceName,
      Version: serviceVersion,
      ServerRole: deployment.serverRole,
      Environment: environmentName,
      Action: 'Install',
      ExpectedNodeDeployments: expectedNodeDeployments
    }
  };

  return Promise.resolve(deploymentServiceKeyValue);
}

module.exports = {
  getKeyValue
};


/***/ }),
/* 319 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



function getKeyValue(deployment) {
  let deploymentId = deployment.id;
  let deploymentKeyValue = {
    key: `deployments/${deploymentId}/overall_status`,
    value: 'In Progress'
  };

  return Promise.resolve(deploymentKeyValue);
}

module.exports = {
  getKeyValue
};


/***/ }),
/* 320 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let ajv = __webpack_require__(110);
let amazonClientFactory = __webpack_require__(14);
let DeploymentCommandHandlerLogger = __webpack_require__(39);
let packageMover = __webpack_require__(321);

const options = {
  allErrors: true,
  format: 'fast'
};

let validate = ajv(options).compile(__webpack_require__(323));

module.exports = function PreparePackageCommandHandler(command) {
  let logger = new DeploymentCommandHandlerLogger(command);
  let mover = packageMover(logger);
  return preparePackage(mover, command).catch((error) => {
    let msg = 'An error has occurred preparing the package';
    logger.error(msg, error);
    return Promise.reject(error);
  });
};

let preparePackage = function (mover, command) {
  if (!validate(command)) {
    return Promise.reject({ command, errors: validate.errors });
  }

  let destination = command.destination;
  let source = command.source;
  let accountName = command.accountName;

  return amazonClientFactory.createS3Client(accountName)
    .then(s3 => mover.copyPackage(source.url, destination, s3));
};


/***/ }),
/* 321 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let logger = __webpack_require__(2);
let simpleHttp = __webpack_require__(322);
let s3Url = __webpack_require__(129);

function PackageMover(deploymentLogger) {
  this.downloadPackage = function (url) {
    if (s3Url.parse(url) !== undefined) {
      deploymentLogger.info(`Downloading package from S3: ${url}`);
      return Promise.resolve().then(() => {
        let downloadStream = s3Url.getObject(url);
        downloadStream.on('error', (e) => {
          logger.error(e);
          deploymentLogger.warn(`Download failed: ${e.message}`);
        });
        return downloadStream;
      });
    } else {
      deploymentLogger.info(`Downloading package: ${url}`);
      return simpleHttp.getResponseStream(url)
        .then((input) => {
          let headers = input.headers;
          if (!(/\/zip$/.test(headers['content-type']))) {
            return Promise.reject(new Error(`Expected a zip file. ${url}`));
          } else {
            return input;
          }
        });
    }
  };

  this.uploadPackage = function (destination, stream, s3client) {
    let params = {
      Bucket: destination.bucket,
      Key: destination.key,
      Body: stream
    };

    let request = s3client.upload(params);

    return request.promise().then(
      (rsp) => {
        deploymentLogger.info(`Package uploaded to: ${rsp.Location}`);
        return Promise.resolve();
      },
      (err) => {
        let message = `Package upload failed: ${err.message}`;
        deploymentLogger.warn(message);
        logger.error(err);
        return Promise.reject(err);
      });
  };

  this.copyPackage = function (fromUrl, destination, s3client) {
    return this.downloadPackage(fromUrl)
      .then((stream) => {
        return this.uploadPackage(destination, stream, s3client);
      });
  };
}

module.exports = deploymentLogger => new PackageMover(deploymentLogger);


/***/ }),
/* 322 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let http = __webpack_require__(133);
let https = __webpack_require__(134);

function getResponseStream(url) {
  const isError = response => !(response.statusCode >= 200 && response.statusCode < 300);
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    let scheme = url.startsWith('https') ? https : http;
    const request = scheme.get(url, (response) => {
      // handle http errors
      if (isError(response)) {
        let error = new Error(`HTTP GET ${url} failed with status code ${response.statusCode}: ${response.statusMessage}`);
        error.statusCode = response.statusCode;
        error.statusMessage = response.statusMessage;
        error.url = url;
        reject(error);
      }
      resolve(response);
    });
    // handle connection errors of the request
    request.on('error', err => reject(err));
  });
}

module.exports = { getResponseStream };


/***/ }),
/* 323 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  id: 'http://thetrainline.com/environment-manager/command/PreparePackageCommand-schema#',
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'PreparePackageCommand',
  description: 'A command to copy a package from one location in S3 to another',
  type: 'object',
  properties: {
    accountName: {
      description: 'The name of the account that owns the S3 bucket',
      type: 'string',
      minLength: 1,
      maxLength: 255
    },
    destination: { $ref: '#/definitions/s3destination' },
    source: { $ref: '#/definitions/sourcePackage' }
  },
  required: ['accountName', 'destination', 'source'],

  definitions: {
    sourcePackage: {
      description: 'Describes a package that can be converted to a CodeDeploy archive',
      type: 'object',
      oneOf: [
        { $ref: '#/definitions/codeDeployRevision' }
      ]
    },
    s3destination: {
      description: 'Describes an S3 location',
      type: 'object',
      properties: {
        bucket: {
          description: 'S3 bucket',
          type: 'string',
          minLength: 1,
          maxLength: 255
        },
        key: {
          description: 'S3 key',
          type: 'string',
          minLength: 1,
          maxLength: 1024
        }
      },
      required: ['bucket', 'key']
    },
    codeDeployRevision: {
      description: 'Describes a CodeDeploy revision as a source package',
      type: 'object',
      properties: {
        url: { $ref: '#/definitions/url' }
      },
      required: ['url']
    },
    semver: {
      type: 'string',
      minLength: 1,
      maxLength: 127,
      pattern: '^[0-9]+\.[0-9]+\.[0-9]+(-.+)?' // TODO: Check redundant escapes in regex (eslint no-useless-escape)
    },
    url: {
      type: 'string',
      pattern: '^https?://'
    }
  }
};


/***/ }),
/* 324 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let DeploymentCommandHandlerLogger = __webpack_require__(39);
let sender = __webpack_require__(6);
let _ = __webpack_require__(1);
let CreateLaunchConfiguration = __webpack_require__(325);
let CreateAutoScalingGroup = __webpack_require__(326);

module.exports = function ProvideInfrastructure(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  return co(function* () {
    let accountName = command.accountName;
    let asgsToCreate = command.asgsToCreate;
    let launchConfigsToCreate = command.launchConfigsToCreate;

    logger.info('Creating required infrastructure...');
    logger.info(`${launchConfigsToCreate.length} launch configs to create`);

    yield launchConfigsToCreate.map(
      template => provideLaunchConfiguration(template, accountName, command)
    );

    _.each(launchConfigsToCreate, (template) => {
      let securityGroupsNames = _.map(template.securityGroups, sg => sg.getName());
      logger.info(`LaunchConfiguration ${template.launchConfigurationName} Security Groups: ${securityGroupsNames.join(', ')}`);
    });

    logger.info(`${asgsToCreate.length} ASGs to create`);
    yield asgsToCreate.map(
      template => provideAutoScalingGroup(template, accountName, command)
    );
  }).catch((error) => {
    logger.error('An error has occurred providing the expected infrastructure', error);
    return Promise.reject(error);
  });
};

function provideLaunchConfiguration(launchConfigurationTemplate, accountName, parentCommand) {
  let command = {
    name: 'CreateLaunchConfiguration',
    accountName,
    template: launchConfigurationTemplate
  };

  return sender.sendCommand(CreateLaunchConfiguration, { command, parent: parentCommand }).catch(error => (
      error.name === 'LaunchConfigurationAlreadyExistsError' ?
        Promise.resolve() :
        Promise.reject(error)
  ));
}

function provideAutoScalingGroup(autoScalingTemplate, accountName, parentCommand) {
  let command = {
    name: 'CreateAutoScalingGroup',
    accountName,
    template: autoScalingTemplate
  };

  return sender.sendCommand(CreateAutoScalingGroup, { command, parent: parentCommand }).catch(error => (
      error.name === 'AutoScalingGroupAlreadyExistsError' ?
        Promise.resolve() :
        Promise.reject(error)
  ));
}


/***/ }),
/* 325 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let assert = __webpack_require__(3);
let co = __webpack_require__(0);
let DeploymentCommandHandlerLogger = __webpack_require__(39);
let _ = __webpack_require__(1);
const launchConfigurationResourceFactory = __webpack_require__(58);

module.exports = function CreateLaunchConfigurationCommandHandler(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  assert(command, 'Expected "command" argument not to be null.');
  assert(command.template, 'Expected "command" argument to contain "template" property not null.');
  assert(command.accountName, 'Expected "command" argument to contain "accountName" property not null or empty.');

  return co(function* () {
    let template = command.template;
    let accountName = command.accountName;
    let launchConfigurationName = template.launchConfigurationName;

    logger.info(`Creating [${launchConfigurationName}] LaunchConfiguration...`);

    let launchConfigurationClient = yield launchConfigurationResourceFactory.create(undefined, { accountName });

    let request = getCreateLaunchConfigurationRequest(template);
    yield launchConfigurationClient.post(request);

    logger.info(`LaunchConfiguration [${launchConfigurationName}] has been created`);
  });
};

function getCreateLaunchConfigurationRequest(template) {
  return {
    LaunchConfigurationName: template.launchConfigurationName,
    AssociatePublicIpAddress: false,
    ImageId: template.image.id,
    InstanceType: template.instanceType,
    KeyName: template.keyName,
    InstanceMonitoring: {
      Enabled: template.detailedMonitoring
    },
    IamInstanceProfile: template.iamInstanceProfile,
    SecurityGroups: _.map(template.securityGroups, 'GroupId'),
    UserData: template.userData,
    BlockDeviceMappings: template.devices
  };
}


/***/ }),
/* 326 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let co = __webpack_require__(0);
let DeploymentCommandHandlerLogger = __webpack_require__(39);
let autoScalingGroupClientFactory = __webpack_require__(25);

module.exports = function CreateAutoScalingGroupCommandHandler(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  assert(command, 'Expected "command" argument not to be null.');
  assert(command.template, 'Expected "command" argument to contain "template" property not null.');
  assert(command.accountName, 'Expected "command" argument to contain "accountName" property not null or empty.');

  return co(function* () {
    let template = command.template;
    let accountName = command.accountName;
    let autoScalingGroupName = template.autoScalingGroupName;

    logger.info(`Creating [${autoScalingGroupName}] AutoScalingGroup...`);

    let autoScalingGroupClient = yield autoScalingGroupClientFactory.create(undefined, {
      accountName
    });

    let request = getCreateAutoScalingGroupRequest(template);
    yield createAutoScalingGroup(logger, autoScalingGroupClient, request);

    logger.info(`AutoScalingGroup [${autoScalingGroupName}] has been created`);

    logger.info(`Configuring [${autoScalingGroupName}] AutoScalingGroup...`);
    yield attachLifecycleHook(logger, autoScalingGroupClient, template);
    yield attachNotificationsByTemplate(logger, autoScalingGroupClient, template);
    logger.info(`AutoScalingGroup [${autoScalingGroupName}] has been configured`);
  });
};

function attachLifecycleHook(logger, asgClient, template) {
  if (!template.scaling || !template.scaling.terminationDelay) {
    return Promise.resolve();
  }

  let request = {
    AutoScalingGroupName: template.autoScalingGroupName,
    LifecycleHookName: '10min-draining',
    HeartbeatTimeout: template.scaling.terminationDelay * 60,
    LifecycleTransition: 'autoscaling:EC2_INSTANCE_TERMINATING',
    DefaultResult: 'CONTINUE'
  };

  return asgClient.attachLifecycleHook(request);
}

function attachNotificationsByTemplate(logger, autoScalingGroupClient, template) {
  return co(function* () {
    let autoScalingGroupName = template.autoScalingGroupName;
    let requests = getAttachNotificationsRequests(template);

    if (!requests.length) {
      logger.info(`No [${autoScalingGroupName}] AutoScalingGroup notification has to be attached to any SNS topic`);
      return;
    }

    logger.info(`Attaching [${autoScalingGroupName}] AutoScalingGroup notifications to SNS topics...`);

    yield requests.map(request => attachNotifications(autoScalingGroupClient, request));

    logger.info(`All [${autoScalingGroupName}] AutoScalingGroup notifications have been attached to SNS topics`);
  });
}

// ----------------------------------------------------------------------------------------------
// Functions to promisify [autoScalingGroupClient] interface

function createAutoScalingGroup(logger, autoScalingGroupClient, request) {
  return autoScalingGroupClient.post(request);
}

function attachNotifications(autoScalingGroupClient, request) {
  return autoScalingGroupClient.attachNotifications(request);
}

// ----------------------------------------------------------------------------------------------
// Functions to create requests understandable to AWS AutoScaling APIs

function getCreateAutoScalingGroupRequest(template) {
  let request = {
    AutoScalingGroupName: template.autoScalingGroupName,
    LaunchConfigurationName: template.launchConfigurationName,
    MaxSize: template.size.max,
    MinSize: template.size.min,
    VPCZoneIdentifier: template.subnets.join(','),
    DesiredCapacity: template.size.desired,
    Tags: getAutoScalingGroupTags(template.tags)
  };

  return request;
}

function getAutoScalingGroupTags(tags) {
  let autoScalingGroupTags = [];
  for (let tag in tags) {
    if ({}.hasOwnProperty.call(tags, tag)) {
      autoScalingGroupTags.push({
        Key: tag,
        Value: tags[tag]
      });
    }
  }

  return autoScalingGroupTags;
}

function getAttachNotificationsRequests(template) {
  let requests = template.topicNotificationMapping.map((mapping) => {
    let request = {
      AutoScalingGroupName: template.autoScalingGroupName,
      TopicARN: mapping.topicArn,
      NotificationTypes: mapping.notificationTypes
    };

    return request;
  });

  return requests;
}


/***/ }),
/* 327 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let config = __webpack_require__(5);

function getHealthcheck(req, res) {
  res.json({ OK: true, Version: config.get('APP_VERSION') });
}

module.exports = {
  getHealthcheck
};


/***/ }),
/* 328 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let GetASGState = __webpack_require__(329);
let ScanServersStatus = __webpack_require__(335);
let co = __webpack_require__(0);
let Environment = __webpack_require__(9);
let OpsEnvironment = __webpack_require__(130);
let Promise = __webpack_require__(10);
let environmentProtection = __webpack_require__(114);
let opsEnvironment = __webpack_require__(45);
let param = __webpack_require__(21);
let getMetadataForDynamoAudit = __webpack_require__(20).getMetadataForDynamoAudit;
const sns = __webpack_require__(12);
let { when } = __webpack_require__(23);
let { ifNotFound, notFoundMessage } = __webpack_require__(24);

let environmentNotFound = notFoundMessage('environment');

/**
 * GET /environments
 */
function getEnvironments(req, res, next) {
  return OpsEnvironment.getAll()
    .then(list => Promise.map(list, env => env.toAPIOutput()))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /environments/{name}
 */
function getEnvironmentByName(req, res, next) {
  const environmentName = req.swagger.params.name.value;

  OpsEnvironment.getByName(environmentName)
    .then(when(env => !env.isNothing(), env => env.toAPIOutput()))
    .then(ifNotFound(environmentNotFound))
    .then(send => send(res))
    .catch(next);
}

/**
 * GET /environments/{name}/protected
 */
function isEnvironmentProtectedFromAction(req, res) {
  const environmentName = req.swagger.params.name.value;
  const action = req.swagger.params.action.value;

  environmentProtection.isActionProtected(environmentName, action)
    .then(isProtected => res.json({ isProtected }));
}

/**
 * GET /environments/{name}/deploy-lock
 */
function getDeploymentLock(req, res, next) {
  let key = {
    EnvironmentName: param('name', req)
  };
  opsEnvironment.get(key)
    .then(data => ({
      EnvironmentName: data.EnvironmentName,
      Value: {
        DeploymentsLocked: !!data.Value.DeploymentsLocked
      },
      Version: data.Audit.Version
    }))
    .then(data => res.json(data)).catch(next);
}

/**
 * PUT /environments/{name}/deploy-lock
 */
function putDeploymentLock(req, res, next) {
  let environmentName = param('name', req);
  let key = {
    EnvironmentName: environmentName
  };
  let expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  let input = req.swagger.params.body.value;
  let isLocked = input.DeploymentsLocked;

  return opsEnvironment.setDeploymentLock({ key, metadata, isLocked }, expectedVersion)
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/environments/${environmentName}/deploy-lock`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: environmentName
      }
    }))
    .catch(next);
}

/**
 * GET /environments/{name}/maintenance
 */
function getMaintenance(req, res, next) {
  let key = {
    EnvironmentName: param('name', req)
  };
  opsEnvironment.get(key)
    .then(data => ({
      EnvironmentName: data.EnvironmentName,
      Value: {
        InMaintenance: !!data.Value.EnvironmentInMaintenance
      },
      Version: data.Audit.Version
    }))
    .then(data => res.json(data)).catch(next);
}

/**
 * PUT /environments/{name}/maintenance
 */
function putMaintenance(req, res, next) {
  let environmentName = param('name', req);
  let key = {
    EnvironmentName: environmentName
  };
  let expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  let input = req.swagger.params.body.value;
  let isInMaintenance = input.InMaintenance;

  return opsEnvironment.setMaintenance({ key, metadata, isInMaintenance }, expectedVersion)
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/environments/${environmentName}/maintenance`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: environmentName
      }
    }))
    .catch(next);
}

/**
 * GET /environments/{name}/servers
 */
function getEnvironmentServers(req, res, next) {
  const environmentName = req.swagger.params.name.value;

  ScanServersStatus({ environmentName, filter: {} }).then(data => res.json(data)).catch(next);
}

/**
 * GET /environments/{name}/servers/{asgName}
 */
function getEnvironmentServerByName(req, res, next) {
  const environmentName = req.swagger.params.name.value;
  const asgName = req.swagger.params.asgName.value;

  GetASGState({ environmentName, asgName }).then(data => res.json(data)).catch(next);
}

/**
 * GET /environments/{name}/accountName
 */
function getEnvironmentAccountName(req, res, next) {
  const environmentName = req.swagger.params.name.value;

  return co(function* () { // eslint-disable-line func-names
    const accountName = yield (yield Environment.getByName(environmentName)).getAccountName();
    res.send(accountName);
  }).catch(next);
}

/**
 * GET /environments/{name}/schedule
 */
function getEnvironmentSchedule(req, res, next) {
  let key = {
    EnvironmentName: param('name', req)
  };
  opsEnvironment.get(key)
    .then(data => ({
      EnvironmentName: data.EnvironmentName,
      Value: {
        ManualScheduleUp: data.Value.ManualScheduleUp,
        ScheduleAutomatically: data.Value.ScheduleAutomatically,
        DefaultSchedule: data.Value.DefaultSchedule
      },
      Version: data.Audit.Version
    }))
    .then(data => res.json(data)).catch(next);
}

/**
 * PUT /environments/{name}/schedule
 */
function putEnvironmentSchedule(req, res, next) {
  let environmentName = param('name', req);
  let key = {
    EnvironmentName: environmentName
  };
  let expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  let schedule = req.swagger.params.body.value;

  return opsEnvironment.setSchedule({ key, metadata, schedule }, expectedVersion)
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/environments/${environmentName}/schedule`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: environmentName
      }
    }))
    .catch(next);
}


/**
 * GET /environments/{name}/schedule-status
 */
function getEnvironmentScheduleStatus(req, res, next) {
  const environmentName = req.swagger.params.name.value;
  const at = req.swagger.params.at.value;

  return OpsEnvironment.getByName(environmentName)
    .then(env => ({ Status: env.getScheduleStatus(at) }))
    .then(data => res.json(data))
    .catch(next);
}

module.exports = {
  getEnvironments,
  getEnvironmentByName,
  getEnvironmentAccountName,
  getEnvironmentServers,
  getEnvironmentServerByName,
  getEnvironmentScheduleStatus,
  putEnvironmentSchedule,
  getEnvironmentSchedule,
  isEnvironmentProtectedFromAction,
  getMaintenance,
  putMaintenance,
  getDeploymentLock,
  putDeploymentLock
};


/***/ }),
/* 329 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let getASGState = __webpack_require__(135);

module.exports = function GetServerState(query) {
  return getASGState(query.environmentName, query.asgName);
};


/***/ }),
/* 330 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let {
  getAllServices,
  getService,
  getServiceHealth,
  getAllNodes,
  getNode,
  getNodeHealth
} = __webpack_require__(331);

module.exports = {
  getAllServices,
  getService,
  getServiceHealth,
  getAllNodes,
  getNode,
  getNodeHealth
};


/***/ }),
/* 331 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let retry = __webpack_require__(108);
let HttpRequestError = __webpack_require__(77);
let consulClient = __webpack_require__(44);
let logger = __webpack_require__(2);
let _ = __webpack_require__(1);
let assert = __webpack_require__(3);

function getAllServices(environment) {
  let getServiceList = clientInstance => clientInstance.catalog.service.list();
  let filterByDeploymentId = list => _.pickBy(list, s => s.some(tag => tag.indexOf('deployment_id:') === 0));

  let promiseFactoryMethod = () =>
    createConsulClient(environment)
      .then(getServiceList)
      .then(filterByDeploymentId)
      .then(formatServices);

  return executeAction(promiseFactoryMethod);
}

function getService(environment, serviceQuery) {
  let nodeKey = `${environment}-${serviceQuery}`;
  return executeConsul(environment, clientInstance => clientInstance.catalog.service.nodes(nodeKey))
    .then((service) => {
      if (!service.length) return service;
      let firstService = service[0];
      firstService.ServiceTags = unravelTags(firstService.ServiceTags);
      return firstService;
    });
}

function getServiceHealth(environment, serviceQuery) {
  let nodeKey = `${environment}-${serviceQuery}`;
  return executeConsul(environment, clientInstance => clientInstance.health.service(nodeKey));
}

function getAllNodes(environment) {
  return executeConsul(environment, clientInstance => clientInstance.catalog.node.list());
}

function getNode(environment, nodeName) {
  assert(nodeName, 'nodeName is required');
  return executeConsul(environment, clientInstance => clientInstance.catalog.node.services(nodeName))
    .then((nodes) => {
      if (!nodes || !nodes.Services) {
        return nodes;
      } else {
        // Filter out services that were not installed via environment manager
        nodes.Services = _.filter(nodes.Services,
          service => service.Tags && service.Tags.find(tag => tag.startsWith('deployment_id')));
        return nodes;
      }
    });
}

function getNodeHealth(environment, nodeName) {
  assert(nodeName, 'nodeName is required');
  return executeConsul(environment, clientInstance => clientInstance.health.node(nodeName));
}

function executeConsul(environment, fn) {
  assert(environment);
  let promiseFactoryMethod = () => createConsulClient(environment).then(fn);
  return executeAction(promiseFactoryMethod);
}

function formatServices(services) {
  return _.mapValues(services, unravelTags);
}

function unravelTags(service) {
  return service.reduce((val, tag) => {
    let tagComponents = tag.split(':');
    val[tagComponents[0]] = tagComponents[1];
    return val;
  }, {});
}

function executeAction(promiseFactoryMethod) {
  let operation = retry.operation({
    retries: 3,
    minTimeout: 1000
  });

  let errorHandler = (reject, error) => {
    logger.error(error.toString(true));
    if ((error instanceof HttpRequestError) && operation.retry(error)) reject(error);
    if (operation.mainError() !== null) {
      reject(operation.mainError());
    } else {
      reject(error.toString(true));
    }
  };

  return new Promise((resolve, reject) => {
    operation.attempt(() => {
      promiseFactoryMethod().then(resolve).catch(error => errorHandler(reject, error));
    });
  });
}

function createConsulClient(environment) {
  assert(environment);
  return consulClient.create({ environment, promisify: true });
}

module.exports = {
  createConsulClient,
  getAllServices,
  getService,
  getServiceHealth,
  getAllNodes,
  getNodeHealth,
  getNode
};


/***/ }),
/* 332 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let Enums = __webpack_require__(11);
let DIFF_STATE = Enums.DIFF_STATE;
let DEPLOYMENT_STATUS = Enums.DEPLOYMENT_STATUS;

function formatConsulService(service, healthchecks, deploymentId, deploymentStatus, deploymentCause, logUrl) {
  let instanceServiceHealthChecks = getInstanceServiceHealthChecks(healthchecks, service.ID);
  return {
    Name: getSimpleServiceName(service.Service),
    Version: service.Tags.version,
    Slice: service.Tags.slice,
    Cluster: service.Tags.owning_cluster,
    ServerRole: service.Tags.server_role,
    DeploymentId: deploymentId,
    DeploymentStatus: deploymentStatus,
    DeploymentCause: deploymentCause,
    LogLink: logUrl,
    OverallHealth: getInstanceServiceOverallHealth(instanceServiceHealthChecks),
    HealthChecks: instanceServiceHealthChecks,
    DiffWithTargetState: null,
    Issues: { Warnings: [], Errors: [] }
  };
}

function formatMissingService(targetService, deploymentStatus, logURL) {
  let missingService = {
    Name: targetService.Name,
    Version: targetService.Version,
    Slice: targetService.Slice,
    DeploymentId: targetService.DeploymentId,
    DeploymentStatus: deploymentStatus,
    Action: targetService.Action,
    HealthChecks: [],
    LogLink: logURL,
    OverallHealth: Enums.HEALTH_STATUS.Missing,
    DiffWithTargetState: (targetService.Action === Enums.ServiceAction.INSTALL ? DIFF_STATE.Missing : DIFF_STATE.Ignored),
    Issues: { Warnings: [], Errors: [] }
  };
  if (targetService.Action === Enums.ServiceAction.INSTALL) {
    missingService.Issues.Warnings.push('Service that is in target state is missing');
  }
  return missingService;
}

function mapConsulTags(tags) {
  return _.reduce(tags, (result, tag) => {
    let firstColon = tag.indexOf(':');
    let key = tag.substr(0, firstColon);
    result[key] = tag.substr(firstColon + 1);
    return result;
  }, {});
}

function getOverallHealth(checks) {
  let check = _.find(checks, { CheckID: 'serfHealth' });
  if (check === undefined) {
    return Enums.HEALTH_STATUS.NoData;
  } else if (check.Status === 'passing') {
    return Enums.HEALTH_STATUS.Healthy;
  } else {
    return Enums.HEALTH_STATUS.Error;
  }
}

function getInstanceServiceOverallHealth(checks) {
  if (_.every(checks, { Status: 'passing' })) {
    return Enums.HEALTH_STATUS.Healthy;
  } else {
    return Enums.HEALTH_STATUS.Error;
  }
}

function getInstanceServiceHealthChecks(checks, serviceId) {
  let filteredChecks = _.filter(checks, { ServiceID: serviceId });
  return _.map(filteredChecks, check => ({
    CheckId: check.CheckID,
    Name: check.Name,
    Notes: check.Notes,
    Status: check.Status
  }));
}

function getInstanceDeploymentStatus(services) {
  let expectedServices = _.filter(services, service => service.DiffWithTargetState !== DIFF_STATE.Unexpected);

  if (_.some(expectedServices, service =>
      // If any service deployment is unsuccessful, instance deployment status is also unsuccessful
    service.DeploymentStatus === DEPLOYMENT_STATUS.Failed)) {
    return DEPLOYMENT_STATUS.Failed;
  } else if (_.every(services, { DeploymentStatus: DEPLOYMENT_STATUS.Success })) {
    return DEPLOYMENT_STATUS.Success;
  } else {
    // This should happen if there's no "Failed" and at least one "In Progress" deployment
    return DEPLOYMENT_STATUS.InProgress;
  }
}

function getRunningServicesCount(services) {
  return _.filter(services, s => s.DiffWithTargetState !== DIFF_STATE.Missing).length;
}

function hasMissingOrUnexpectedServices(services) {
  return _.filter(services, s => s.DiffWithTargetState === DIFF_STATE.Missing || s.DiffWithTargetState === DIFF_STATE.Unexpected).length > 0;
}

function getSimpleServiceName(name) {
  return name.split('-')[1] || name;
}

function getServiceAndSlice(obj) {
  return obj.Name + (obj.Slice !== 'none' ? `-${obj.Slice}` : '');
}

function getLogUrl(deploymentId, accountName, instanceId) {
  return deploymentId ?
    `/api/v1/deployments/${deploymentId}/log?account=${accountName}&instance=${instanceId}` :
    null;
}

module.exports = {
  mapConsulTags,
  getOverallHealth,
  getInstanceServiceOverallHealth,
  getInstanceServiceHealthChecks,
  getInstanceDeploymentStatus,
  getSimpleServiceName,
  getServiceAndSlice,
  getLogUrl,
  formatConsulService,
  formatMissingService,
  getRunningServicesCount,
  hasMissingOrUnexpectedServices
};


/***/ }),
/* 333 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let co = __webpack_require__(0);

let Enums = __webpack_require__(11);
let DIFF_STATE = Enums.DIFF_STATE;
let logger = __webpack_require__(2);
let serviceTargets = __webpack_require__(26);

const HEALTH_GOOD = Enums.HEALTH_STATUS.Healthy;
const HEALTH_BAD = Enums.HEALTH_STATUS.Error;
const SERVICE_INSTALL = Enums.ServiceAction.INSTALL;

/**
 * Generate service health info (with checks list and pass / fail)
 */
function getServiceChecksInfo(serviceObjects) {
  // Get all health checks for all instances of this service
  let serviceChecks = _.flatMap(serviceObjects, 'HealthChecks');
  let checksGrouped = _.groupBy(serviceChecks, 'Name');
  return _.map(checksGrouped, checks =>
    // If some instances checks failed for a given check, mark as failed
    // also, don't count in instance into working
     ({
       Name: checks[0].Name,
       Status: _.some(checks, { Status: 'critical' }) ? HEALTH_BAD : HEALTH_GOOD
     }));
}

function getServiceOverallHealth(healthChecks) {
  return _.some(healthChecks, { Status: HEALTH_BAD }) ? HEALTH_BAD : HEALTH_GOOD;
}

function checkServiceProperties(svcA, svcB, prop) {
  if (svcA[prop] !== svcB[prop]) {
    // TODO: What behaviour/feature do we expect if a service does not match the expected target?
    logger.warn(`${svcB.Name} ${svcB.Version} ${prop} mismatch:`);
    logger.warn(` Found: ${svcA[prop]} and ${svcB[prop]}`);
  }
}

function getServiceAndSlice(obj) {
  return obj.Name + (obj.Slice !== 'none' ? `-${obj.Slice}` : '');
}

function* getServicesState(environmentName, runtimeServerRoleName, instances) {
  let targetServiceStates = yield serviceTargets.getAllServiceTargets(environmentName, runtimeServerRoleName);
  let allServiceObjects = _.flatMap(instances, instance => instance.Services);
  allServiceObjects = _.compact(allServiceObjects);

  // Find all objects representing particular service for all nodes
  let instanceServicesGrouped = _.groupBy(allServiceObjects, obj => getServiceAndSlice(obj));

  let servicesList = _.map(instanceServicesGrouped, (serviceObjects) => {
    let service = _.find(targetServiceStates, targetService => getServiceAndSlice(targetService) === getServiceAndSlice(serviceObjects[0]));

    // That is a service that is not in a target state, but on at least one of instances
    if (service === undefined) {
      // Create fake "target state" object to generate metadata
      service = {
        Name: serviceObjects[0].Name,
        Version: serviceObjects[0].Version,
        Slice: serviceObjects[0].Slice,
        DiffWithTargetState: DIFF_STATE.Unexpected
      };
    } else {
      service.DiffWithTargetState = null;

      // Check instance serviceObjects for inconsistencies with target state
      _.each(serviceObjects, (obj) => {
        checkServiceProperties(obj, service, 'Version');
        checkServiceProperties(obj, service, 'DeploymentId');
      });

      if (service.Action === 'Ignore') {
        service.DiffWithTargetState = DIFF_STATE.Ignored;
      } else {
        service.DiffWithTargetState = null;
      }
    }

    let serviceInstances = _.filter(instances, instance => _.some(instance.Services, { Name: service.Name, Slice: service.Slice }));
    let presentOnInstancesCount = 0;
    let serviceObjectsOnInstances = [];

    // Healthy nodes are these where service is present AND service's status is healthy
    let healthyNodes = _.filter(serviceInstances, (instance) => {
      let serviceOnInstance = _.find(instance.Services, { Name: service.Name, Slice: service.Slice });

      if (serviceOnInstance !== undefined) {
        serviceObjectsOnInstances.push(serviceOnInstance);
        // If at least one instance has state "Missing", overall service state will also be "Missing"
        if (serviceOnInstance.DiffWithTargetState === DIFF_STATE.Missing) {
          service.DiffWithTargetState = DIFF_STATE.Missing;
        } else {
          presentOnInstancesCount += 1;
        }
        return serviceOnInstance.OverallHealth === 'Healthy';
      }
      return false;
    });

    let serviceHealthChecks = getServiceChecksInfo(serviceObjects);
    let serviceAction = service.Action || SERVICE_INSTALL;

    let missingOrUnexpectedInstances = _.filter(serviceObjectsOnInstances,
      s => s.DiffWithTargetState === DIFF_STATE.Missing || s.DiffWithTargetState === DIFF_STATE.Unexpected).length > 0;

    return {
      Name: service.Name,
      Version: service.Version,
      Slice: service.Slice,
      DiffWithTargetState: service.DiffWithTargetState,
      DeploymentId: service.DeploymentId,
      InstancesNames: _.map(serviceInstances, 'Name'),
      InstancesCount: {
        Healthy: healthyNodes.length,
        Present: presentOnInstancesCount,
        Total: serviceInstances.length
      },
      MissingOrUnexpectedInstances: missingOrUnexpectedInstances,
      OverallHealth: getServiceOverallHealth(serviceHealthChecks, serviceInstances),
      HealthChecks: serviceHealthChecks,
      Action: serviceAction
    };
  });

  // Look for services that weren't deployed to any of the instances on ASG, but are in target state.
  _.each(targetServiceStates, (targetService) => {
    if (_.find(servicesList, { Name: targetService.Name, Slice: targetService.Slice }) === undefined) {
      let missingService = {
        Name: targetService.Name,
        Version: targetService.Version,
        Slice: targetService.Slice,
        DiffWithTargetState: (targetService.Action === Enums.ServiceAction.INSTALL ? DIFF_STATE.Missing : DIFF_STATE.Ignored),
        DeploymentId: targetService.DeploymentId,
        InstancesNames: [],
        InstancesCount: {
          Healthy: 0,
          Present: 0,
          Total: 0
        },
        HealthChecks: [],
        OverallHealth: Enums.HEALTH_STATUS.Missing,
        Action: targetService.Action
      };
      servicesList.push(missingService);
    }
  });

  return servicesList;
}

module.exports = co.wrap(getServicesState);


/***/ }),
/* 334 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let co = __webpack_require__(0);
const ec2InstanceResourceFactory = __webpack_require__(83);

function* getAWSInstances(accountName, instancesIds) {
  let resource = yield ec2InstanceResourceFactory.create(undefined, { accountName });

  let filter = {
    'instance-id': instancesIds
  };

  let instances = yield resource.all({ filter });
  return _.map(instances, (instance) => {
    let ret = {
      PrivateIpAddress: instance.PrivateIpAddress,
      InstanceId: instance.InstanceId,
      InstanceType: instance.InstanceType,
      AvailabilityZone: instance.Placement.AvailabilityZone,
      State: _.capitalize(instance.State.Name),
      ImageId: instance.ImageId,
      LaunchTime: instance.LaunchTime
    };
    instance.Tags.forEach((tag) => {
      ret[tag.Key] = tag.Value;
    });
    return ret;
  });
}

module.exports = co.wrap(getAWSInstances);


/***/ }),
/* 335 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let co = __webpack_require__(0);
let moment = __webpack_require__(76);
let logger = __webpack_require__(2);
let sender = __webpack_require__(6);
let AutoScalingGroup = __webpack_require__(19);
let Instance = __webpack_require__(60);
let ScanCrossAccountImages = __webpack_require__(53);
let GetNode = __webpack_require__(336);

module.exports = co.wrap(ScanServersStatusQueryHandler);

function* ScanServersStatusQueryHandler(query) {
  const environmentName = query.environmentName;

  let allStartTime = moment.utc();

  return Promise.all([
    AutoScalingGroup.getAllByEnvironment(environmentName),
    Instance.getAllByEnvironment(environmentName),
    getAllImages()
  ]).then((results) => {
    let asgs = results[0];
    let allInstances = results[1];
    let allImages = results[2];

    if (query.filter.cluster) {
      asgs = _.filter(asgs, asg => asg.getTag('OwningCluster') === query.filter.cluster);
    }

    return Promise.all(asgs.map((asg) => {
      let instances = asg.Instances.map((asgInstance) => {
        let instance = _.find(allInstances, { InstanceId: asgInstance.InstanceId });

        if (instance && instance.State.Name !== 'terminated') {
          let image = getImage(allImages, instance.ImageId);
          return {
            instanceId: instance.InstanceId,
            name: instance.getTag('Name', ''),
            ami: image,
            status: asgInstance.HealthStatus
          };
        } else {
          return null;
        }
      }).filter(instance => !!instance);

      let instanceCount = instances.length;
      let status = getStatus(instances, asg.DesiredCapacity);
      let ami = getAmi(instances);

      return getServicesInstalledOnInstances(environmentName, instances)
        .then(services => ({
          Name: asg.AutoScalingGroupName,
          Role: asg.getRuntimeServerRoleName(),
          Status: status,
          Cluster: asg.getTag('OwningCluster', ''),
          Schedule: asg.getTag('Schedule', ''),
          IsBeingDeleted: asg.Status === 'Delete in progress',
          Size: {
            Current: instanceCount,
            Desired: asg.DesiredCapacity
          },
          Services: services.map(getServiceView(environmentName)),
          Ami: ami
        }));
    })).then((asgResults) => {
      let filteredAsgs = asgResults.filter(byStatus(query.filter.status));
      let result = {
        EnvironmentName: environmentName,
        Value: filteredAsgs
      };

      let duration = moment.duration(moment.utc().diff(allStartTime)).asMilliseconds();
      logger.debug(`server-status-query: Whole query took: ${duration}ms`);

      return result;
    });
  });
}

function getServicesInstalledOnInstances(environment, instances) {
  // eslint-disable-next-line arrow-body-style
  return Promise.all(instances.map((instance) => {
    return getConsulServicesForNode(environment, instance.name).then((consulServices) => {
      let services = sanitizeConsulServices(consulServices);
      return services;
    });
  })).then((services) => {
    let uniqueServices = _.uniqWith(_.flatten(services), _.isEqual);
    return uniqueServices;
  });
}

function getConsulServicesForNode(environment, nodeName) {
  if (!nodeName) return Promise.resolve({});
  return sender.sendQuery(GetNode, {
    query: {
      name: 'GetNode',
      environment,
      nodeName
    }
  }).then((consulNode) => {
    if (!consulNode) return [];
    return consulNode.Services;
  }, () => {
    return [];
  });
}

function getServiceView(env) {
  return (service) => {
    let regExp = new RegExp(`^${env}-`);
    let nameWithoutPrefix = service.name.replace(regExp, '');
    let name = nameWithoutPrefix.replace(/(-green|-blue)$/, '');

    return {
      Name: service.name,
      FriendlyName: name,
      Version: service.version,
      Slice: service.slice
    };
  };
}

function getAmi(instances) {
  if (_.some(instances, i => !i.ami)) return null;

  let amis = instances.map(i => i.ami);
  let amiNames = _.uniq(amis.map(ami => ami.name));

  if (amiNames.length !== 1) return undefined;
  let ami = amis[0];

  return {
    Name: ami.name,
    Age: ami.DaysBehindLatest,
    IsLatestStable: ami.isLatestStable
  };
}


function getStatus(instances, desiredCapacity) {
  if (_.some(instances, instance => instance.status !== 'Healthy')) {
    return {
      Status: 'Error',
      Reason: 'Not all instances are healthy'
    };
  }

  if (instances.length < desiredCapacity) {
    return {
      Status: 'Warning',
      Reason: 'The number of instances is lower than desired'
    };
  }

  return {
    Status: 'Healthy'
  };
}

function sanitizeConsulServices(consulServices) {
  let keys = _.keys(consulServices);

  return keys.map((key) => {
    let obj = {
      name: consulServices[key].Service
    };

    consulServices[key].Tags.forEach((tag) => {
      let parts = tag.split(':');
      obj[parts[0]] = parts[1];
    });

    return obj;
  });
}

function getImage(images, imageId) {
  let foundImages = images.filter(image => image.ImageId === imageId);
  if (foundImages.length === 0) return null;

  let image = foundImages[0];

  return {
    name: image.Name,
    created: image.CreationDate,
    DaysBehindLatest: image.DaysBehindLatest,
    isLatestStable: image.IsLatestStable
  };
}

function byStatus(status) {
  return function (resource) {
    if (!status) return true;
    return resource.Status.toLowerCase() === status.toLowerCase();
  };
}

function getAllImages() {
  let startTime = moment.utc();

  return sender.sendQuery(ScanCrossAccountImages, {
    query: {
      name: 'ScanCrossAccountImages'
    }
  }).then((result) => {
    let duration = moment.duration(moment.utc().diff(startTime)).asMilliseconds();
    logger.debug(`server-status-query: AllImagesQuery took ${duration}ms`);
    return result;
  });
}



/***/ }),
/* 336 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let serviceDiscovery = __webpack_require__(64);

module.exports = function GetNode(query) {
  return serviceDiscovery.getNode(query.environment, query.nodeName);
};


/***/ }),
/* 337 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let sender = __webpack_require__(6);
let ScanImages = __webpack_require__(338);
let ScanCrossAccountImages = __webpack_require__(53);
let _ = __webpack_require__(1);

function getImages(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const stable = req.swagger.params.stable.value;

  let resultsP;
  if (accountName === undefined) {
    let query = {
      name: 'ScanCrossAccountImages',
      filter: {}
    };
    resultsP = sender.sendQuery(ScanCrossAccountImages, { query });
  } else {
    let query = {
      name: 'ScanImages',
      accountName,
      filter: {}
    };
    resultsP = sender.sendQuery(ScanImages, { query });
  }

  return resultsP.then((data) => {
    if (stable !== undefined) {
      res.json(_.filter(data, { IsStable: stable }));
    } else {
      res.json(data);
    }
  }).catch(next);
}

module.exports = {
  getImages
};


/***/ }),
/* 338 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
const ec2ImageResourceFactory = __webpack_require__(103);
let imageSummary = __webpack_require__(102);
let assert = __webpack_require__(3);

/**
 * Get all the EC2 images ordered by AMI Type (lexicographical, ascending) then by
 * AMI version (semver, descending).
 */
function* handler(query) {
  assert(query.accountName);
  let parameters = { accountName: query.accountName };
  let resource = yield ec2ImageResourceFactory.create(undefined, parameters);

  let images = yield resource.all({ filter: query.filter });
  return imageSummary.rank(images.map(imageSummary.summaryOf).sort(imageSummary.compare));
}

module.exports = co.wrap(handler);



/***/ }),
/* 339 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let co = __webpack_require__(0);
let ScanInstances = __webpack_require__(65);
let ScanCrossAccountInstances = __webpack_require__(340);
let EnterAutoScalingGroupInstancesToStandby = __webpack_require__(341);
let ExitAutoScalingGroupInstancesFromStandby = __webpack_require__(342);
let asgips = __webpack_require__(118);
let Instance = __webpack_require__(60);
let serviceTargets = __webpack_require__(26);
let logger = __webpack_require__(2);
let getInstanceState = __webpack_require__(136);
let Environment = __webpack_require__(9);
let Enums = __webpack_require__(11);
let ScanInstancesScheduleStatus = __webpack_require__(343);
let fp = __webpack_require__(4);
let merge = __webpack_require__(344);
const sns = __webpack_require__(12);

/* The tags that should be added to each instance as properties.
 * If the instance already has a property with one of these names
 * its value will be replaced with an array containing the value of
 * the tag and the original value of the property. It will not be
 * overwritten.
 * */
const FLATTEN_TAGS = [
  'aws:autoscaling:groupName',
  'ContactEmail',
  'Environment',
  'EnvironmentType',
  'Name',
  'OwningCluster',
  'OwningClusterShortName',
  'Role',
  'Schedule',
  'SecurityZone'
];

/**
 * GET /instances
 */
function getInstances(req, res, next) {
  let accountName = req.swagger.params.account.value;
  const cluster = req.swagger.params.cluster.value;
  const environmentName = req.swagger.params.environment.value;
  const maintenance = req.swagger.params.maintenance.value;
  const ipAddress = req.swagger.params.ip_address.value;
  const instanceId = req.swagger.params.instance_id.value;
  const since = req.swagger.params.since.value;
  const includeDeploymentsStatus = req.swagger.params.include_deployments_status.value;

  co(function* () {
    let filter = {};

    if (cluster !== undefined) {
      filter['tag:OwningCluster'] = cluster;
    }
    if (environmentName !== undefined) {
      filter['tag:Environment'] = environmentName;
      if (accountName === undefined) {
        accountName = yield Environment.getAccountNameForEnvironment(environmentName);
      }
    }
    if (maintenance === true) {
      filter['tag:Maintenance'] = 'true';
    }
    if (ipAddress !== undefined) {
      filter['private-ip-address'] = ipAddress;
    }
    if (instanceId !== undefined) {
      filter['instance-id'] = instanceId;
    }

    if (_.isEmpty(filter)) {
      filter = null;
    }

    let handler = accountName !== undefined ? ScanInstances : ScanCrossAccountInstances;
    let list = yield handler({ accountName, filter });

    // Note: be wary of performance - this filters instances AFTER fetching all from AWS
    if (since !== undefined) {
      let sinceDate = new Date(since);
      list = _.filter(list, (instance) => {
        if (instance.CreationTime === undefined) {
          return true;
        }
        return sinceDate.getTime() < new Date(instance.CreationTime).getTime();
      });
    }

    if (includeDeploymentsStatus === true) {
      if (list.length > Enums.DEPLOYMENT_INSTANCES_LIST_MAXIMUM_LENGTH) {
        throw new Error(`Too many results: ${list.length}. Please refine your search query, ie. choose later since date, or limit query to one environment`);
      }

      list = yield _.map(list, (instance) => {
        let instanceEnvironment = instance.getTag('Environment', null);
        let instanceName = instance.getTag('Name', null);
        let instanceRoleTag = instance.getTag('Role', null);

        if ([instanceEnvironment, instanceName, instanceRoleTag].some(x => x === null || x === '')) {
          // This instance won't be returned
          logger.warn(`One of the tags [Environment, Name, Role] is not set. The EC2 instance will be skipped. ${instance.InstanceId}.`);
          return false;
        }

        let tagsToFlatten = fp.flow(
          fp.map(name => [name, instance.getTag(name, null)]),
          fp.filter(([, value]) => value !== null && value !== undefined),
          fp.fromPairs
        )(FLATTEN_TAGS);

        // If instances were fetched by cross scan, instance.AccountName is available, otherwise, for simple scan use accountName
        return getInstanceState(
          instance.AccountName || accountName,
          instanceEnvironment, instanceName, instance.InstanceId, instanceRoleTag, instance.LaunchTime, null)
          .then((state) => {
            return merge(instance, state, tagsToFlatten);
          }, (error) => {
            logger.error(error);
            return false;
          });
      });

      // Remove instances without Environment tag
      list = _.compact(list);
      list = _.sortBy(list, instance => new Date(instance.LaunchTime)).reverse();
      res.json(list);
    } else {
      res.json(list);
    }
  }).catch(next);
}

/**
 * GET /instances/{id}
 */
function getInstanceById(req, res, next) {
  const id = req.swagger.params.id.value;
  Instance.getById(id).then(instance => res.json(instance)).catch(next);
}

/**
 * PUT /instances/{id}/maintenance
 */
function putInstanceMaintenance(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  const enable = body.enable;
  let name = null;

  co(function* () {
    let instance = yield Instance.getById(id);
    const instanceIds = [id];
    const accountName = instance.AccountName;
    const autoScalingGroupName = instance.getAutoScalingGroupName();
    const environmentName = instance.getTag('Environment');
    name = environmentName;

    /**
     * Update ASG IPS table
     */
    let entry = yield asgips.get(accountName, { AsgName: 'MAINTENANCE_MODE' });
    let ips = JSON.parse(entry.IPs);
    if (enable === true) {
      ips.push(instance.PrivateIpAddress);
      ips = _.uniq(ips);
    } else {
      _.pull(ips, instance.PrivateIpAddress);
    }
    yield asgips.put(accountName, { AsgName: 'MAINTENANCE_MODE', IPs: JSON.stringify(ips) });

    /**
     * Put instance to standby on AWS
     */
    let handler = enable ? EnterAutoScalingGroupInstancesToStandby : ExitAutoScalingGroupInstancesFromStandby;
    try {
      yield handler({ accountName, autoScalingGroupName, instanceIds });
    } catch (err) {
      if (err.message.indexOf('is not in Standby') !== -1 || err.message.indexOf('cannot be exited from standby as its LifecycleState is InService') !== -1) {
        logger.warn(`ASG ${autoScalingGroupName} instance ${id} is already in desired state for ASG Standby: ${enable}`);
      } else {
        throw err;
      }
    }

    yield instance.persistTag({ key: 'Maintenance', value: enable.toString() });

    /**
     * Now switch Maintenance mode (previously done in separate end point)
     */
    serviceTargets.setInstanceMaintenanceMode(accountName, instance.PrivateIpAddress, environmentName, enable);

    res.send({ ok: true });
  })
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/instances/${id}/maintenance`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: 'id',
        Environment: name
      }
    }))
    .catch(next);
}

/**
 * GET /instances/{id}/connect
 */
function connectToInstance(req, res, next) {
  const id = req.swagger.params.id.value;
  Instance.getById(id).then((instance) => {
    res.status(200);
    res.set({
      'content-type': 'application/rdp',
      'content-disposition': `attachment; filename*=UTF-8''${id}.rdp`
    });
    res.send(`full address:s:${instance.PrivateIpAddress}`);
  }).catch(next);
}

/**
 * GET /instances/schedule-actions
 */
function getScheduleActions(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const dateTime = req.swagger.params.date.value;

  let query = {
    name: 'ScanInstancesScheduleStatus',
    accountName,
    dateTime
  };

  ScanInstancesScheduleStatus(query)
    .then(actions => res.json(actions))
    .catch(next);
}

module.exports = {
  getInstances,
  getInstanceById,
  putInstanceMaintenance,
  connectToInstance,
  getScheduleActions
};


/***/ }),
/* 340 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let scanCrossAccount = __webpack_require__(80);
let ScanInstances = __webpack_require__(65);

module.exports = function ScanCrossAccountInstances(query) {
  return scanCrossAccount(({ AccountNumber }) => { ScanInstances(Object.assign({}, query, { accountName: AccountNumber })); });
};


/***/ }),
/* 341 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let co = __webpack_require__(0);
let sender = __webpack_require__(6);
let autoScalingGroupSizePredictor = __webpack_require__(137);
let AutoScalingGroup = __webpack_require__(19);
let SetAutoScalingGroupSize = __webpack_require__(82);
const asgResourceFactory = __webpack_require__(25);

module.exports = function EnterAutoScalingGroupInstancesToStandbyCommandHandler(command) {
  assert(command, 'Expected "command" argument not to be null.');
  assert(command.accountName, 'Expected "command" argument to contain "accountName" property not null or empty.');
  assert(command.autoScalingGroupName, 'Expected "command" argument to contain "autoScalingGroupName" property not null or empty.');
  assert(command.instanceIds, 'Expected "command" argument to contain "instanceIds" property not null or empty.');

  return co(function* () {
    // Send a query to obtain the AutoScalingGroup information.
    let autoScalingGroup = yield AutoScalingGroup.getByName(command.accountName, command.autoScalingGroupName);

    // Create a resource to work with AutoScalingGroups in the target AWS account.
    let parameters = { accountName: command.accountName };
    let asgResource = yield asgResourceFactory.create(undefined, parameters);

    // Predict AutoScalingGroup size after entering instances to standby
    let expectedSize = yield autoScalingGroupSizePredictor.predictSizeAfterEnteringInstancesToStandby(
      autoScalingGroup,
      command.instanceIds);

    // Before entering instances to Standby the AutoScalingGroup minimum size has to be
    // reduced because the action of "entering instances to standby" will automatically
    // reduce the desired capacity and this cannot be less than the minimum size.
    yield setAutoScalingGroupSize({ min: expectedSize }, command);

    // Through the resource instance previously created the AutoScalingGroup instances
    // are entered to standby
    yield asgResource.enterInstancesToStandby({ name: command.autoScalingGroupName, instanceIds: command.instanceIds });

    // After entering instances to Standby the AutoScalingGroup maximum size should be
    // reduced as well as the minimum size. This because the AutoScalingGroup minimum,
    // maximum and desired size are equal by convention.
    yield setAutoScalingGroupSize({ max: expectedSize }, command);

    return {
      InstancesEnteredToStandby: command.instanceIds
    };
  });
};

function setAutoScalingGroupSize(size, parentCommand) {
  let command = {
    name: 'SetAutoScalingGroupSize',
    accountName: parentCommand.accountName,
    autoScalingGroupName: parentCommand.autoScalingGroupName,
    autoScalingGroupMinSize: size.min,
    autoScalingGroupMaxSize: size.max
  };

  return sender.sendCommand(SetAutoScalingGroupSize, { command, parent: parentCommand });
}


/***/ }),
/* 342 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
const asgResourceFactory = __webpack_require__(25);
let co = __webpack_require__(0);
let sender = __webpack_require__(6);
let autoScalingGroupSizePredictor = __webpack_require__(137);
let AutoScalingGroup = __webpack_require__(19);
let SetAutoScalingGroupSize = __webpack_require__(82);

module.exports = function ExitAutoScalingGroupInstancesFromStandby(command) {
  assert(command.accountName !== undefined && command.accountName !== null);
  assert(command.autoScalingGroupName !== undefined && command.autoScalingGroupName !== null);
  assert(command.instanceIds !== undefined && command.instanceIds !== null);

  return co(function* () {
    let parameters;
    let childCommand;

    let autoScalingGroup = yield AutoScalingGroup.getByName(command.accountName, command.autoScalingGroupName);

    // Predict AutoScalingGroup size after exiting instances from standby
    let expectedSize = yield autoScalingGroupSizePredictor.predictSizeAfterExitingInstancesFromStandby(autoScalingGroup, command.instanceIds);

    // Create a resource to work with AutoScalingGroups in the target AWS account.
    parameters = { accountName: command.accountName };
    let asgResource = yield asgResourceFactory.create(undefined, parameters);

    // Before exiting instances from Standby the AutoScalingGroup maximum size has to be
    // increased because the action of "exiting instances from standby" will automatically
    // increase the desired capacity and this cannot be greater than the maximum size.
    childCommand = {
      name: 'SetAutoScalingGroupSize',
      accountName: command.accountName,
      autoScalingGroupName: command.autoScalingGroupName,
      autoScalingGroupMaxSize: expectedSize
    };
    yield sender.sendCommand(SetAutoScalingGroupSize, { command: childCommand, parent: command });

    // Through the resource instance previously created the AutoScalingGroup instances
    // are exited from standby
    parameters = {
      name: command.autoScalingGroupName,
      instanceIds: command.instanceIds
    };
    yield asgResource.exitInstancesFromStandby(parameters);

    // After exiting instances from Standby the AutoScalingGroup minimum size should be
    // increased as well as the maximum size. This because the AutoScalingGroup minimum,
    // maximum and desired size are equal by convention.
    childCommand = {
      name: 'SetAutoScalingGroupSize',
      accountName: command.accountName,
      autoScalingGroupName: command.autoScalingGroupName,
      autoScalingGroupMinSize: expectedSize
    };
    yield sender.sendCommand(SetAutoScalingGroupSize, { command: childCommand, parent: command });

    return { InstancesExitedFromStandby: command.instanceIds };
  });
};


/***/ }),
/* 343 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



/* eslint-disable */

let co = __webpack_require__(0);
let _ = __webpack_require__(1);
let sender = __webpack_require__(6);
let scheduling = __webpack_require__(131);
let opsEnvironment = __webpack_require__(45);
let ScanInstances = __webpack_require__(65);
let ScanAutoScalingGroups = __webpack_require__(61);

module.exports = function ScanInstancesScheduleStatusQueryHandler(query) {
  return co(function* () { // eslint-disable-line func-names
    let instances = yield getInstances(query);
    let dateTime = query.dateTime ? query.dateTime : new Date();
    return [...scheduledActionsForInstances(instances, dateTime), ...scheduledActionsForASGs(instances, dateTime)];
  });
};

function getInstances(query) {
  return Promise.all([getAllInstances(query), getAllEnvironments(query), getAllASGs(query)]).then((data) => {
    let allInstances = data[0];
    let environments = buildEnvironmentIndex(data[1]);
    let asgs = buildASGIndex(data[2]);
    let instances = [];
    allInstances.forEach((instance) => {
      let environmentName = getInstanceTagValue(instance, 'environment');
      if (environmentName) {
        instance.Environment = findInIndex(environments, environmentName.toLowerCase());
      }
      let asgName = getInstanceTagValue(instance, 'aws:autoscaling:groupName');
      instance.AutoScalingGroup = findInIndex(asgs, asgName);
      instances.push(instance);
    });
    return instances;
  });
}

function getAutoScalingGroups(instances){
  var autoScalingGroups = {};
  for (var instance in instances) {
    var currentInstance = instances[instance];
    if (typeof currentInstance.AutoScalingGroup !== 'undefined') {
      autoScalingGroups[currentInstance.AutoScalingGroup.AutoScalingGroupName] = currentInstance.AutoScalingGroup;
    }
  }
  return autoScalingGroups;
}

function getStandAloneInstances(instances){
  var standAloneInstances = [];
  for (var instance in instances) {
    var currentInstance = instances[instance];
    if (typeof currentInstance.AutoScalingGroup === 'undefined') {
      standAloneInstances.push(currentInstance);
    }
  }
  return standAloneInstances;
}

function scheduledActionsForASGs(instances, dateTime){
  let actions = [];
  let autoScalingGroups = getAutoScalingGroups(instances);
  for(var autoScalingGroupName in autoScalingGroups) {
    let autoScalingGroup = autoScalingGroups[autoScalingGroupName];
    let scalingActions = scheduling.actionsForAutoScalingGroup(autoScalingGroup, instances, dateTime);
    if (scalingActions && scalingActions.length && scalingActions.length > 0)
      actions = [...actions, ...scalingActions];
  }
  return actions;
}

function scheduledActionsForInstances(instances, dateTime) {
  return getStandAloneInstances(instances).map((instance) => {
    let action = scheduling.actionForInstance(instance, dateTime);
    return action;
  });
}

function buildEnvironmentIndex(environmentData) {
  let environments = {};

  environmentData.forEach((env) => {
    let environment = env.Value;
    environment.Name = env.EnvironmentName.toLowerCase();
    environments[environment.Name] = environment;
  });

  return environments;
}

function buildASGIndex(asgData) {
  let asgs = {};

  asgData.forEach((asg) => {
    asgs[asg.AutoScalingGroupName] = asg;
  });

  return asgs;
}

function findInIndex(map, name) {
  return name ? map[name] : undefined;
}

function getInstanceTagValue(instance, tagName) {
  let tag = _.first(instance.Tags.filter(t => t.Key.toLowerCase() === tagName.toLowerCase()));
  return tag ? tag.Value : undefined;
}

function getAllInstances(query) {
  return sender.sendQuery(ScanInstances, {
    query: {
      name: 'ScanInstances',
      accountName: query.accountName,
      queryId: query.queryId,
      username: query.username,
      timestamp: query.timestamp
    }
  });
}

function getAllEnvironments() {
  return opsEnvironment.scan();
}

function getAllASGs(query) {
  return sender.sendQuery(ScanAutoScalingGroups, {
    query: {
      name: 'ScanAutoScalingGroups',
      accountName: query.accountName,
      queryId: query.queryId,
      username: query.username,
      timestamp: query.timestamp
    }
  });
}


/***/ }),
/* 344 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * Merge the values of each property of the arguments into the corresponding property of the output.
 * The value of each property of the returned object is the array of values of the same property of each argument object.
 * @param {*} objects
 */

function merge(...objects) {
  let result = objects
    .filter(x => x !== undefined && x !== null)
    .reduce((acc, nxt) => {
      if (typeof nxt !== 'object') {
        throw new Error('Each argument must be an object');
      }
      Object.keys(nxt).forEach((key) => {
        if (acc[key] === undefined) {
          acc[key] = [nxt[key]];
        } else {
          acc[key].unshift(nxt[key]);
        }
      });
      return acc;
    }, {});
  Object.keys(result).forEach((key) => {
    let value = result[key];
    if (value.length === 1) {
      result[key] = value[0];
    }
  });
  return result;
}

module.exports = merge;


/***/ }),
/* 345 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let sender = __webpack_require__(6);
let ScanNginxUpstreams = __webpack_require__(346);

/**
 * GET /load-balancer/{name}
 */
function getLoadBalancer(req, res, next) {
  const fqdn = req.swagger.params.id.value;

  let query = {
    name: 'ScanNginxUpstreams',
    instanceDomainName: fqdn
  };

  return sender.sendQuery(ScanNginxUpstreams, { query }).then(data => res.json(data)).catch(next);
}

module.exports = {
  getLoadBalancer
};


/***/ }),
/* 346 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
const nginxUpstreamsResourceFactory = __webpack_require__(347);

function* handler(query) {
  // Create an instance of the Nginx resource
  let resource = yield nginxUpstreamsResourceFactory.create(undefined, {});

  // Scan resource items
  const params = { instanceDomainName: query.instanceDomainName };

  return resource.all(params);
}

module.exports = co.wrap(handler);


/***/ }),
/* 347 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let url = __webpack_require__(63);
let request = __webpack_require__(138);
let utils = __webpack_require__(51);
let logger = __webpack_require__(2);

let HttpRequestError = __webpack_require__(77);
let ResourceNotFoundError = __webpack_require__(37);

function NginxUpstreamsResource() {
  function httpErrorToError(error) {
    switch (error.code) {
      case 'ENOTFOUND':
        return new ResourceNotFoundError(`Hostname "${error.hostname}" not found.`);
      default:
        return new HttpRequestError(`Remote host: ${error.code}`);
    }
  }

  function httpResponseToError(response) {
    return new HttpRequestError(`Remote host: ${response.statusCode}`);
  }

  function invalidJsonToError(value) {
    return new HttpRequestError(`Remote host: Invalid JSON: ${value} - 200`);
  }

  function isNotNginxUpstreamPeerBackup(nginxUpstreamPeer) {
    return !nginxUpstreamPeer.backup;
  }

  function asUpstreamItem(nginxUpstreamPeer) {
    let upstreamItem = {
      Server: nginxUpstreamPeer.server,
      State: nginxUpstreamPeer.state,
      HealthChecks: nginxUpstreamPeer.health_checks
    };

    return upstreamItem;
  }

  this.all = function (parameters) {
    let uri = url.format({
      protocol: 'http',
      hostname: parameters.instanceDomainName,
      pathname: '/status/upstreams'
    });

    return new Promise((resolve, reject) => {
      request(uri, (error, response, body) => {
        // Error connecting to the host
        if (error) return reject(httpErrorToError(error));

        // Error response from the host
        if (response.statusCode !== 200) {
          logger.error(`Unexpected Nginx Upstream response: ${response.body}`,
            { body: response.body, statusCode: response.statusCode });
          return reject(httpResponseToError(response));
        }

        // Unexpected non JSON body
        let nginxUpstreams = utils.safeParseJSON(body);
        if (!nginxUpstreams) return reject(invalidJsonToError(body));

        let upstreams = [];

        for (let upstreamName in nginxUpstreams) {
          if ({}.hasOwnProperty.call(nginxUpstreams, upstreamName)) {
            let nginxUpstream = nginxUpstreams[upstreamName];
            if (!nginxUpstream || !nginxUpstream.peers) return invalidJsonToError(body);

            let upstream = {
              Name: upstreamName,
              Hosts: nginxUpstream.peers.filter(isNotNginxUpstreamPeerBackup).map(asUpstreamItem)
            };

            upstreams.push(upstream);
          }
        }

        return resolve(upstreams);
      });
    });
  };
}

module.exports = {
  canCreate: resourceDescriptor => resourceDescriptor.type.toLowerCase() === 'nginx/upstreams',
  create: () => Promise.resolve(new NginxUpstreamsResource())
};


/***/ }),
/* 348 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



/* Defines an Express route handler that accepts a request for a package upload URL for a combination of service, version and (optionally) environment.
 * Responds with a pre-signed S3 PUT URL valid for a fixed time period.
 */

/* eslint-disable import/no-extraneous-dependencies */
let environmentExistsRule = __webpack_require__(349);
let log = __webpack_require__(2); // eslint-disable import/no-extraneous-dependencies
let makeValidationFunction = __webpack_require__(350);
let masterAccountClient = __webpack_require__(16); // eslint-disable-line import/no-extraneous-dependencies
let s3PackageLocator = __webpack_require__(128);
let serviceExistsRule = __webpack_require__(351);
let dynamicResponseCreator = __webpack_require__(139);
/* eslint-enable import/no-extraneous-dependencies */

let config = __webpack_require__(5);
let _ = __webpack_require__(4);

const EM_PACKAGE_UPLOAD_TIMEOUT = config.get('EM_PACKAGES_UPLOAD_TIMEOUT') || 600;

let param = p => _.get(['swagger', 'params', p, 'value']);

function s3location(req) {
  let params = ['service', 'version', 'environment'];
  let extractParameterNameValuePair = name => [name, param(name)(req)];
  return _.flow(
  _.map(extractParameterNameValuePair),
  _.fromPairs,
  s3PackageLocator.s3PutLocation)(params);
}

function respondWithPreSignedUrl(request) {
  let params = _.assign(s3location(request))({
    Expires: EM_PACKAGE_UPLOAD_TIMEOUT,
    ContentType: 'application/zip'
  });
  return masterAccountClient.createS3Client().then(s3 =>
    new Promise((resolve) => {
      s3.getSignedUrl('putObject', params, (err, url) => {
        if (err) {
          log.error(`Creation of pre-signed package upload URL failed: ${err.message}\n${err.stack}`);
          resolve(response => response.status(500).send());
        } else {
          resolve(dynamicResponseCreator(200, url));
        }
      });
    }));
}

function packageDoesNotExist(req) {
  let params = s3location(req);

  return masterAccountClient.createS3Client()
  .then(client => client.headObject(params).promise())
  .then(
    rsp => ({ title: 'The package already exists.', detail: `${rsp.LastModified}`, status: '409' }),
    err => (err.statusCode === 404 ? undefined : Promise.reject(err))
  );
}

function serviceExists(req) {
  let service = param('service')(req);
  return serviceExistsRule(service).then(e => Object.assign(e, { status: '422' }));
}

function environmentExists(req) {
  let environment = param('environment')(req);
  return environmentExistsRule(environment).then(e => Object.assign(e, { status: '422' }));
}

function respondWithErrors(errors) {
  // Error format:  http://jsonapi.org/format/#errors
  let statuses = _.flow(_.map(_.get('status')), _.uniq)(errors);
  let status = (statuses.length === 1) ? statuses[0] : '422';
  return response => response.status(status).json({ errors });
}

function validate(validationRules) {
  let validationOptions = {
    rules: validationRules,
    validContinuation: respondWithPreSignedUrl,
    invalidContinuation: respondWithErrors
  };
  return makeValidationFunction(validationOptions);
}

function getPackageUploadUrlByServiceVersion(request, response, next) {
  validate([packageDoesNotExist, serviceExists])(request).then(send => send(response)).catch(next);
}

function getPackageUploadUrlByServiceVersionEnvironment(request, response, next) {
  validate([packageDoesNotExist, serviceExists, environmentExists])(request).then(send => send(response)).catch(next);
}

module.exports = {
  getPackageUploadUrlByServiceVersion,
  getPackageUploadUrlByServiceVersionEnvironment
};


/***/ }),
/* 349 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



/* eslint-disable import/no-extraneous-dependencies */
let environmentDatabase = __webpack_require__(54);
let log = __webpack_require__(2); // eslint-disable import/no-extraneous-dependencies
/* eslint-enable import/no-extraneous-dependencies */

/* Returns an error in the format specified at http://jsonapi.org/format/#errors
 * if the service does not exist.
 */
function environmentExists(environment) {
  return environmentDatabase.getEnvironmentByName(environment).then(
    () => [],
    (err) => {
      log.warn(err);
      return {
        title: 'Environment Not Found',
        detail: `environment name: ${environment}`
      };
    });
}

module.exports = environmentExists;


/***/ }),
/* 350 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



/**
 * @typedef {Object} Otions
 * @property {Rule[]} rules - an array of validation functions
 * @property {Function} validContinuation - continuation for the valid case
 * @property {Function} invalidContinuation - continuation for the invalid case
 */

 /**
 * @typedef {Function} Rule
 * @param {Any} item - the item to be validated.
 * @returns {Array<Any>} errors - validation errors.
 */

let _ = __webpack_require__(4);

/**
 * Create a validation function.
 * @param {Options} - the validation rules and continuations.
 * @returns {Function} - a function that takes the item to validate as its argument and returns the result of the valid or invalid continuation as appropriate.
 */
function createValidationFunction(options) {
  let rules = options.rules;
  let validContinuation = options.validContinuation;
  let invalidContinuation = options.invalidContinuation;
  return (argument) => {
    let errorsPromise = Promise.all(rules.map(rule => Promise.resolve().then(() => rule(argument)))).then(_.flow(_.filter(x => x !== undefined), _.flatten));
    return errorsPromise.then(errors => (errors.length === 0 ? validContinuation(argument) : invalidContinuation(errors)));
  };
}

module.exports = createValidationFunction;


/***/ }),
/* 351 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let log = __webpack_require__(2);
let servicesDb = __webpack_require__(28);

/* Returns an error in the format specified at http://jsonapi.org/format/#errors
 * if the service does not exist.
 */
function serviceExists(service) {
  let serviceNotFound = () => ({
    title: 'Service Not Found',
    detail: `service name: ${service}`
  });
  return servicesDb.get({ ServiceName: service })
    .then((rsp => (rsp ? [] : serviceNotFound())),
    (err) => {
      log.warn(err);
      return serviceNotFound();
    });
}

module.exports = serviceExists;


/***/ }),
/* 352 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let serviceDiscovery = __webpack_require__(64);
let getSlices = __webpack_require__(353);
let ScanInstances = __webpack_require__(65);
let toggleSlices = __webpack_require__(354);
let serviceHealth = __webpack_require__(356);
let overallServiceHealth = __webpack_require__(359);
let metadata = __webpack_require__(73);
let Environment = __webpack_require__(9);
let sns = __webpack_require__(12);

function isEmptyResponse(data) {
  return Array.isArray(data) && data.length === 0;
}

let co = __webpack_require__(0);
let _ = __webpack_require__(1);

/**
 * GET /services
 */
function getServices(req, res, next) {
  const environment = req.swagger.params.environment.value;

  return serviceDiscovery.getAllServices(environment).then(data => res.json(data)).catch(next);
}

/**
 * GET /services/{service}/asgs
 */
function getASGsByService(req, res, next) {
  const environment = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const sliceName = req.swagger.params.slice.value;

  return co(function* () {
    let slice = sliceName.toLowerCase() !== 'none' ? `-${sliceName}` : '';
    let service = serviceName + slice;

    let nodes = _.castArray(yield serviceDiscovery.getService(environment, service));
    let accountName = yield Environment.getAccountNameForEnvironment(environment);

    let asgs = yield nodes.map((node) => {
      return co(function* () {
        let filter = {}; filter['tag:Name'] = node.Node;
        let instance = _.first(yield ScanInstances({ accountName, filter }));
        return instance ? instance.getTag('aws:autoscaling:groupName') : null;
      });
    });

    return _.chain(asgs).compact().uniq().map((asg) => {
      return { AutoScalingGroupName: asg };
    }).value();
  }).then(data => res.json(data)).catch(next);
}

/**
 * GET /services/{service}
 */
function getServiceById(req, res, next) {
  const environment = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;

  return serviceDiscovery.getService(environment, serviceName)
    .then(data => (isEmptyResponse(data) ? res.status(404).send(JSON.stringify({ error: 'Service not found.' })) : res.json(data)))
    .catch(next);
}

/**
 * GET /services/{service}/health
 */
function getOverallServiceHealth(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;

  return overallServiceHealth({ environmentName, serviceName }).then(data => res.json(data)).catch(next);
}

/**
 * GET /services/{service}/health/{slice}
 */
function getServiceHealth(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const slice = req.swagger.params.slice.value;

  return serviceHealth({ environmentName, serviceName, slice }).then(data => res.json(data)).catch(next);
}

/**
 * GET /services/{service}/slices
 */
function getServiceSlices(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const active = req.swagger.params.active.value;

  return getSlices({ environmentName, serviceName, active }).then(data => res.json(data)).catch(next);
}
/**
 * PUT /services/{service}/toggle
 */
function putServiceSlicesToggle(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const activeSlice = req.swagger.params.active.value;
  const serviceName = req.swagger.params.service.value;
  const user = req.user;

  return toggleSlices(metadata.addMetadata({ environmentName, serviceName, activeSlice, user }))
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify(
        {
          Endpoint: {
            Url: `/services/${serviceName}/toggle`,
            Method: 'PUT',
            Parameters: [
              {
                Name: 'service',
                Type: 'path',
                Value: serviceName || ''
              },
              {
                Name: 'environment',
                Type: 'query',
                Value: environmentName || ''
              },
              {
                Name: 'active',
                Type: 'query',
                Value: activeSlice || ''
              }
            ]
          }
        }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: serviceName,
        Environment: environmentName,
        ActiveSlice: activeSlice
      }
    }))
    .catch(next);
}

module.exports = {
  getServices,
  getServiceById,
  getServiceHealth,
  getOverallServiceHealth,
  getServiceSlices,
  getASGsByService,
  putServiceSlicesToggle
};


/***/ }),
/* 353 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let getSlices = __webpack_require__(140);
let loadBalancerUpstreams = __webpack_require__(38);

module.exports = function GetSlicesByService(query) {
  assert.equal(typeof query.environmentName, 'string');
  assert.equal(typeof query.serviceName, 'string');

  return loadBalancerUpstreams.inEnvironmentWithService(query.environmentName, query.serviceName)
    .then(upstreams => getSlices.handleQuery(query, upstreams));
};


/***/ }),
/* 354 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let toggleSlices = __webpack_require__(141);
let UpstreamProvider = toggleSlices.UpstreamProvider;
let ToggleUpstreamByServiceVerifier = toggleSlices.ToggleUpstreamByServiceVerifier;
let UpstreamToggler = toggleSlices.UpstreamToggler;
let orchestrate = toggleSlices.orchestrate;
let sender = __webpack_require__(6);
let Environment = __webpack_require__(9);

module.exports = function ToggleSlicesByService(command) {
  assert.equal(typeof command.environmentName, 'string');
  assert.equal(typeof command.serviceName, 'string');

  return Environment.getAccountNameForEnvironment(command.environmentName).then((account) => {
    command.accountName = account;

    let resourceName = `Upstream for "${command.serviceName}" service in "${command.environmentName}" environment`;
    let provider = new UpstreamProvider(sender, command, resourceName);
    let verifier = new ToggleUpstreamByServiceVerifier(sender, command);
    let toggler = new UpstreamToggler(sender, command);

    return orchestrate(provider, verifier, toggler);
  });
};


/***/ }),
/* 355 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let util = __webpack_require__(8);
let BaseError = __webpack_require__(7);

module.exports = function InconsistentSlicesStatusError(message, innerError) {
  this.name = this.constructor.name;
  this.message = message;
  this.innerError = innerError;

  Error.captureStackTrace(this, this.constructor);
};

util.inherits(module.exports, BaseError);


/***/ }),
/* 356 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let Promise = __webpack_require__(10);
let {
  assign,
  flatMap,
  flatten,
  isUndefined,
  map,
  matches,
  omitBy,
  pickBy,
  reduce,
  toPairs
} = __webpack_require__(4);
let GetServerRoles = __webpack_require__(85);
let AutoScalingGroup = __webpack_require__(19);
let serviceDiscovery = __webpack_require__(64);
let { createEC2Client } = __webpack_require__(14);
let { fullyQualifiedServiceNamesFor } = __webpack_require__(142);
let {
  compare,
  currentState,
  desiredCountOf,
  desiredState,
  desiredTopologyOf,
  instancesOf,
  instancesRequestFor,
  summariseComparison } = __webpack_require__(357);
let { getAccountNameForEnvironment } = __webpack_require__(9);

function getAutoScalingGroups(environmentQualifiedRoleNames) {
  return Promise.map(environmentQualifiedRoleNames,
    ({ environment, role }) => AutoScalingGroup.getAllByServerRoleName(environment, role))
    .then(flatten);
}

function getHealth(fullyQualifiedServiceNames) {
  return Promise.map(fullyQualifiedServiceNames, (fullyQualifiedServiceName) => {
    let [environment, service, slice] = fullyQualifiedServiceName.split('-');
    let sliceQualifiedServiceName = `${service}${slice ? `-${slice}` : ''}`;
    return serviceDiscovery.getServiceHealth(environment, sliceQualifiedServiceName);
  }).then(flatten);
}

function getInstances(instanceRequests) {
  let query = instances => ({
    Filters: [
      {
        Name: 'tag:Name',
        Values: instances
      }
    ]
  });
  return Promise.map(toPairs(instanceRequests), ([account, instances]) => {
    let filters = query(instances);
    return createEC2Client(account)
      .then(ec2 => ec2.describeInstances(filters).promise());
  }).then(flatten);
}

function getDesiredState(filters) {
  let rolesP = GetServerRoles(filters);
  let desiredTopologyP = rolesP
    .then(desiredTopologyOf)
    .then(pickBy(matches(omitBy(isUndefined)({
      environment: filters.environmentName,
      service: filters.serviceName,
      slice: filters.slice
    }))));
  let desiredCountsP = rolesP
    .then(({ EnvironmentName, Value }) => map(({ Role }) => ({ environment: EnvironmentName, role: Role }))(Value))
    .then(getAutoScalingGroups)
    .then(desiredCountOf);

  return Promise.join(desiredTopologyP, desiredCountsP, desiredState);
}

function getCurrentState(filters) {
  let fullyQualifiedServiceNames = fullyQualifiedServiceNamesFor(filters);
  let serviceHealthP = getHealth(fullyQualifiedServiceNames);
  let instancesP = serviceHealthP
    .then(serviceHealth => instancesRequestFor(getAccountNameForEnvironment, serviceHealth))
    .then(getInstances)
    .then(flatMap(instancesOf))
    .then(reduce(assign, {}));

  return Promise.join(serviceHealthP, instancesP, currentState);
}

function getServiceHealth(filters) {
  let currentStateP = getCurrentState(filters);
  let desiredStateP = getDesiredState(filters);

  function compareWithSummary(d, c) {
    let comparison = compare(d, c);
    return map(service => assign(summariseComparison(service))(service))(comparison);
  }

  return Promise.join(desiredStateP, currentStateP, compareWithSummary);
}

module.exports = getServiceHealth;


/***/ }),
/* 357 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let Promise = __webpack_require__(10);

let {
  assign,
  defaultTo,
  every,
  filter,
  find,
  flatMap,
  flow,
  fromPairs,
  get,
  groupBy,
  omitBy,
  map,
  mapValues,
  max,
  reduce,
  size,
  sumBy,
  toPairs,
  uniq
} = __webpack_require__(4);
let { valueOfTag } = __webpack_require__(358);
let serviceName = __webpack_require__(143);

let valueOfAwsTag = key => flow(get('Tags'), find(tag => tag.Key === key), get('Value'));

function desiredTopologyOf(getServerRolesResult) {
  let environment = getServerRolesResult.EnvironmentName;
  let fullyQualifiedServiceNameOf = serviceName.format.bind(null, environment);
  return flow(
    get('Value'),
    flatMap(({ Role, Services }) => map(({ Name, Slice }) => ([
      fullyQualifiedServiceNameOf(Name, Slice),
      { environment, role: Role, service: Name, slice: Slice }
    ]))(Services)),
    groupBy(([fullyQualifiedServiceName]) => fullyQualifiedServiceName),
    mapValues(reduce((acc, [, { environment: env, role, service, slice }]) => ({
      environment: env,
      roles: [...acc.roles, role],
      service,
      slice
    }), { roles: [] }))
  )(getServerRolesResult);
}

function instancesOf(describeInstancesResult) {
  let autoScalingGroupOf = valueOfAwsTag('aws:autoscaling:groupName');
  let nameOf = valueOfAwsTag('Name');
  let roleOf = valueOfAwsTag('Role');
  return flow(
    get('Reservations'),
    flatMap(get('Instances')),
    map(instance => [nameOf(instance), { role: roleOf(instance), autoScalingGroup: autoScalingGroupOf(instance) }]),
    fromPairs
  )(describeInstancesResult);
}

function instancesRequestFor(getAwsAccountForEnvironment, serviceHealthResults) {
  let environmentOf = valueOfTag('environment');
  let getEnvironments = flow(
    flatMap(({ Service }) => environmentOf(Service)),
    uniq);

  let getEnvAccountMapper = environments => Promise.map(environments, e => getAwsAccountForEnvironment(e).then(a => [e, a]))
    .then(flow(fromPairs, envAccountMap => env => envAccountMap[env]));

  let groupByAccount = (accountFor, health) => flow(
    flatMap(({ Service, Node: { Node } }) =>
      environmentOf(Service).map(env => [accountFor(env), Node])),
    groupBy(([key]) => key),
    mapValues(flow(map(([, value]) => value), uniq))
  )(health);

  return Promise.resolve(serviceHealthResults)
    .then(getEnvironments)
    .then(getEnvAccountMapper)
    .then(accountFor => groupByAccount(accountFor, serviceHealthResults));
}

function desiredState(desiredTopology, desiredCounts) {
  let sizeOf = (environment, role) => flow(
    get([environment, role, 'desiredCount']),
    defaultTo(0));
  let environmentOf = fullyQualifiedServiceName => fullyQualifiedServiceName.split('-')[0];

  let rolesWithSize = environmentName => flow(
    get('roles'),
    map(role => [role, { desiredCount: sizeOf(environmentName, role)(desiredCounts) }]),
    fromPairs
  );

  return flow(
    toPairs,
    map(([fullyQualifiedServiceName, value]) => [
      fullyQualifiedServiceName,
      assign(value)({ roles: rolesWithSize(environmentOf(fullyQualifiedServiceName))(value) })
    ]),
    fromPairs
  )(desiredTopology);
}

function desiredCountOf(autoScalingGroups) {
  let environmentOf = valueOfAwsTag('Environment');
  let roleOf = valueOfAwsTag('Role');
  return flow(
    map(autoScalingGroup => ({
      environment: environmentOf(autoScalingGroup),
      role: roleOf(autoScalingGroup),
      desiredCount: get('DesiredCapacity')(autoScalingGroup)
    })),
    groupBy(get('environment')),
    mapValues(flow(
      groupBy(get('role')),
      mapValues(flow(
        sumBy(get('desiredCount')),
        desiredCount => ({ desiredCount })
      ))
    ))
  )(autoScalingGroups);
}

function currentState(health, instances) {
  let summarizeHealthChecks = every(({ Status }) => Status === 'passing');
  let summarizeServiceHealthByRole = (acc, node) => {
    let add = (left, right) => ({
      'failing-checks': [...(left['failing-checks'] || []), ...filter(check => check.Status !== 'passing')(right['failing-checks'])],
      'healthyCount': (left.healthyCount || 0) + right.healthyCount,
      'unhealthyCount': (left.unhealthyCount || 0) + right.unhealthyCount
    });
    let myhealth = {
      'failing-checks': node.Checks,
      'healthyCount': node.Healthy ? 1 : 0,
      'unhealthyCount': node.Healthy ? 0 : 1
    };
    if (node.Role) {
      if (!acc.roles) {
        acc.roles = {};
      }
      acc.roles[node.Role] = add(acc.roles[node.Role] || {}, myhealth);
    } else {
      if (!acc.instances) {
        acc.instances = {};
      }
      acc.instances[node.Node] = add(acc.instances[node.Node] || {}, myhealth);
    }
    return acc;
  };

  return flow(
    map(({ Node: { Node }, Service: { Service }, Checks }) => ({
      AutoScalingGroup: get([Node, 'autoScalingGroup'])(instances),
      Checks,
      Healthy: summarizeHealthChecks(Checks),
      Node,
      Role: get([Node, 'role'])(instances),
      Service
    })),
    groupBy(({ Service }) => Service),
    mapValues(serviceNodes => reduce(summarizeServiceHealthByRole, {})(serviceNodes))
  )(health);
}

function compare(desired, current) {
  let flat = flow(
    toPairs,
    flatMap(([key, value]) => {
      let withContext = v => flow(
        assign({
          environment: value.environment,
          service: value.service,
          slice: value.slice
        }),
        assign(v)
      );
      let roles = map(([k, v]) => [key, withContext(v)({ role: k })])(toPairs(value.roles));
      let instances = map(([k, v]) => [key, withContext(v)({ instance: k })])(toPairs(value.instances));
      return [...roles, ...instances];
    })
  );

  let aggregate = query => (left, right) => flow(
    toPairs,
    map(([key, fn]) => [key, fn(left[key], right[key])]),
    fromPairs
  )(query);
  let sum = (x, y) => (x || 0) + (y || 0);
  let cat = (x, y) => [...(x || []), ...(y || [])];

  let states = [...flat(desired), ...flat(current)];

  return flow(
    groupBy(([key]) => key),
    mapValues(flow(
      map(([, value]) => value),
      values => ({
        environment: flow(map(get('environment')), max)(values),
        orphanedInstances: flow(
          filter(({ instance }) => instance !== undefined),
          groupBy(({ instance }) => instance),
          mapValues(reduce(aggregate({ 'failing-checks': cat, 'healthyCount': sum, 'unhealthyCount': sum }), {})),
          toPairs,
          map(([k, v]) => assign(v)({ name: k }))
        )(values),
        roles: flow(
          filter(({ role }) => role !== undefined),
          groupBy(({ role }) => role),
          mapValues(reduce(aggregate({ 'failing-checks': cat, 'healthyCount': sum, 'desiredCount': sum, 'unhealthyCount': sum }), {})),
          toPairs,
          map(([k, v]) => assign(v)({ name: k }))
        )(values),
        service: flow(map(get('service')), max)(values),
        slice: flow(map(get('slice')), max)(values)
      }),
      omitBy(x => x === undefined))),
    toPairs,
    map(([k, v]) => assign({ name: k })(v))
  )(states);
}

function summariseComparison(service) {
  let desiredTotals = flow(
    get('roles'),
    reduce(([desiredN, healthyN], { desiredCount, healthyCount }) => [
      desiredN + desiredCount,
      healthyN + (desiredCount > 0 ? healthyCount : 0)
    ], [0, 0])
  );

  let overCapacity = flow(
    get('roles'),
    filter(role => role.desiredCount === 0),
    reduce((n, { healthyCount, unhealthyCount }) => n + healthyCount + unhealthyCount, 0)
  );

  let orphaned = flow(
    get('orphanedInstances'),
    size
  );

  let [desiredN, desiredHealthyN] = desiredTotals(service);

  return {
    desiredCount: desiredN,
    desiredAndHealthyCount: desiredHealthyN,
    undesiredCount: overCapacity(service) + orphaned(service)
  };
}

module.exports = {
  compare,
  currentState,
  desiredState,
  desiredTopologyOf,
  desiredCountOf,
  instancesOf,
  instancesRequestFor,
  summariseComparison
};


/***/ }),
/* 358 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let { defaultTo, flow, get, groupBy, map, mapValues } = __webpack_require__(4);

function tagsOf(item) {
  function parseTag(str) {
    let sepIdx = str.indexOf(':');
    return [str.slice(0, sepIdx), str.slice(sepIdx + 1)];
  }
  return flow(
    get('Tags'),
    map(parseTag),
    groupBy(([key]) => key),
    mapValues(flow(
      map(([, value]) => value))))(item);
}

let valueOfTag = key => flow(tagsOf, get(key), defaultTo([]));

module.exports = {
  tagsOf,
  valueOfTag
};


/***/ }),
/* 359 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let _ = __webpack_require__(1);
let Enums = __webpack_require__(11);
let HEALTH_STATUS = Enums.HEALTH_STATUS;
let co = __webpack_require__(0);
let GetServerRoles = __webpack_require__(85);
let getASGState = __webpack_require__(135);
let AutoScalingGroup = __webpack_require__(19);

function* getOverallServiceHealth({ environmentName, serviceName }) {
  let serviceRoles = (yield GetServerRoles({ environmentName })).Value;
  _.each(serviceRoles, (role) => {
    role.Services = _.filter(role.Services, { Name: serviceName });
  });

  // Remove from the list roles that don't contain requested service
  serviceRoles = _.filter(serviceRoles, role => _.isEmpty(role.Services) === false);

  let list = [];
  for (let role of serviceRoles) {
    let autoScalingGroups = yield AutoScalingGroup.getAllByServerRoleName(environmentName, role.Role);
    let state;

    for (let asg of autoScalingGroups) {
      try {
        state = yield getASGState(environmentName, asg.AutoScalingGroupName);
      } catch (error) {
        // If AutoScalingGroup is not found (old consul data), don't include it in the results
        if (error.name === 'AutoScalingGroupNotFoundError') {
          state = `not found ${asg.AutoScalingGroupName}`;
          // continue;
        } else {
          throw error;
        }
      }
      let instances = _.filter(state.Instances, instance => _.some(instance.Services, { Name: serviceName }));
      let services = _.filter(state.Services, { Name: serviceName });

      // Filter services on instances info to return only queried service
      _.each(instances, (instance) => {
        instance.Services = _.filter(instance.Services, { Name: serviceName });
      });
      list.push({
        AutoScalingGroupName: asg.AutoScalingGroupName,
        Services: services,
        Instances: instances
      });
    }
  }

  function aggregateHealth(statusList) {
    if (_.every(statusList, { OverallHealth: HEALTH_STATUS.Healthy })) {
      return HEALTH_STATUS.Healthy;
    } else if (_.some(statusList, { OverallHealth: HEALTH_STATUS.Missing })) {
      return HEALTH_STATUS.Missing;
    } else if (_.some(statusList, { OverallHealth: HEALTH_STATUS.Error })) {
      return HEALTH_STATUS.Error;
    } else if (_.some(statusList, { OverallHealth: HEALTH_STATUS.Warning })) {
      return HEALTH_STATUS.Warning;
    } else {
      return HEALTH_STATUS.Unknown;
    }
  }

  _.each(list, (asg) => {
    asg.OverallHealth = aggregateHealth(asg.Services);
  });

  return {
    OverallHealth: aggregateHealth(list),
    AutoScalingGroups: list
  };
}

module.exports = co.wrap(getOverallServiceHealth);


/***/ }),
/* 360 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let GetServerRoles = __webpack_require__(85);
let deleteTargetState = __webpack_require__(361);
const { toggleServiceStatus } = __webpack_require__(127);
const sns = __webpack_require__(12);

/**
 * GET /target-state/{environment}
 */
function getTargetState(req, res, next) {
  const environmentName = req.swagger.params.environment.value;

  GetServerRoles({ environmentName }).then(data => res.json(data)).catch(next);
}

/**
 * DELETE /target-state/{environment}
 */
function deleteTargetStateByEnvironment(req, res, next) {
  const environmentName = req.swagger.params.environment.value;

  deleteTargetState.byEnvironment({ environmentName })
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/target-state/${environmentName}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: environmentName,
        Environment: environmentName
      }
    }))
    .catch(next);
}

/**
 * DELETE /target-state/{environment}/{service}
 */
function deleteTargetStateByService(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;

  deleteTargetState.byService({ environmentName, serviceName })
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/target-state/${environmentName}/${serviceName}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: `${environmentName}/${serviceName}`,
        Environment: environmentName
      }
    }))
    .catch(next);
}

/**
 * DELETE /target-state/{environment}/{service}/{version}
 */
function deleteTargetStateByServiceVersion(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const serviceVersion = req.swagger.params.version.value;

  deleteTargetState.byServiceVersion({ environmentName, serviceName, serviceVersion })
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/target-state/${environmentName}/${serviceName}/${serviceVersion}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        Environment: environmentName,
        ID: `${environmentName}/${serviceName}/${serviceVersion}`
      }
    }))
    .catch(next);
}

/**
 * PUT /target-state/{environment}/{service}/toggle-status
 */
function toggleServiceStatusHandler(req, res, next) {
  const environment = req.swagger.params.environment.value;
  const service = req.swagger.params.service.value;
  const body = req.swagger.params.body.value;
  const enable = body.Enable;
  const slice = body.Slice;
  const serverRole = body.ServerRole;
  const user = req.user;

  toggleServiceStatus({ environment, service, slice, enable, serverRole, user })
    .then((data) => { res.json(data); })
    .catch(next);
}

module.exports = {
  getTargetState,
  deleteTargetStateByEnvironment,
  deleteTargetStateByService,
  deleteTargetStateByServiceVersion,
  toggleServiceStatusHandler
};


/***/ }),
/* 361 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let assert = __webpack_require__(3);
let serviceTargets = __webpack_require__(26);

function scanAndDelete({ environmentName, keyPrefix, condition }) {
  return co(function* () {
    let keyValuePairs = yield serviceTargets.getTargetState(environmentName, { key: keyPrefix, recurse: true });
    let erasedKeys = yield keyValuePairs.filter(keyValuePair =>
      condition(keyValuePair.key, keyValuePair.value)
    ).map((keyValuePair) => {
      return serviceTargets.removeTargetState(environmentName, { key: keyValuePair.key }).then(() => keyValuePair.key);
    });

    return erasedKeys;
  });
}

function byEnvironment({ environmentName }) {
  assert(environmentName);
  return co(function* () {
    let erasedServicesKeys = yield scanAndDelete({
      environmentName,
      keyPrefix: `environments/${environmentName}/services/`,
      condition: () => true
    });

    let erasedRolesKeys = yield scanAndDelete({
      environmentName,
      keyPrefix: `environments/${environmentName}/roles/`,
      condition: () => true
    });

    return erasedServicesKeys.concat(erasedRolesKeys);
  });
}

function byService({ environmentName, serviceName }) {
  assert(environmentName);
  assert(serviceName);
  return co(function* () {
    let erasedServicesKeys = yield scanAndDelete({
      environmentName,
      keyPrefix: `environments/${environmentName}/services/${serviceName}/`,
      condition: () => true
    });

    let erasedRolesKeys = yield scanAndDelete({
      environmentName,
      keyPrefix: `environments/${environmentName}/roles/`,
      condition: key =>
        key.match(`environments\/.*\/roles\/.*\/services\/${serviceName}\/`)
    });

    return erasedServicesKeys.concat(erasedRolesKeys);
  });
}

function byServiceVersion({ environmentName, serviceName, serviceVersion }) {
  assert(environmentName);
  assert(serviceName);
  assert(serviceVersion);
  return co(function* () {
    let erasedServicesKeys = yield scanAndDelete({
      environmentName,
      keyPrefix: `environments/${environmentName}/services/${serviceName}/${serviceVersion}/`,
      condition: () => true
    });

    let erasedRolesKeys = yield scanAndDelete({
      environmentName,
      keyPrefix: `environments/${environmentName}/roles/`,
      condition: (key, value) => {
        return value ? value.Name === serviceName && value.Version === serviceVersion : false;
      }
    });

    return erasedServicesKeys.concat(erasedRolesKeys);
  });
}

module.exports = {
  byEnvironment,
  byService,
  byServiceVersion
};


/***/ }),
/* 362 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let userService = __webpack_require__(50);
let tokenConfiguration = __webpack_require__(363);
let cookieConfiguration = __webpack_require__(72);

/**
 * POST /token
 */
function postAuthorization(req, res, next) {
  let body = req.swagger.params.body.value;
  let credentials = {
    username: body.username,
    password: body.password,
    scope: 'api'
  };

  let duration = tokenConfiguration.getTokenDuration();

  userService.authenticateUser(credentials, duration)
    .then(value => res.send(value)).catch(next);
}

/**
 * DELETE /token
 */
function signOut(req, res, next) {
  let token = getToken(req);

  if (!token) {
    res.status(400).end();
  } else {
    userService.signOut(token)
      .then(() => res.status(200).end()).catch(next);
  }
}

function getToken(req) {
  let cookie = req.cookies[cookieConfiguration.getCookieName()];
  if (cookie) return cookie;

  let authorization = req.headers.authorization;
  if (!authorization) return null;

  let match = /bearer\s+(.*)/i.exec(authorization);
  if (!match) return null;

  return match[1];
}

module.exports = {
  postAuthorization,
  signOut
};


/***/ }),
/* 363 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let config = __webpack_require__(5);

function loadConfiguration() {
  let localConfig = config.getUserValue('local');

  assert(localConfig.authentication, 'missing \'authentication\' field in configuration');
  assert(localConfig.authentication.tokenDuration, 'missing \'authentication.tokenDuration\' field in configuration');

  return {
    tokenDuration: localConfig.authentication.tokenDuration
  };
}

module.exports = {
  getTokenDuration: () => {
    let configuration = loadConfiguration();
    return configuration.tokenDuration;
  }
};


/***/ }),
/* 364 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let getSlices = __webpack_require__(365);
let toggleSlices = __webpack_require__(366);
let metadata = __webpack_require__(73);
const sns = __webpack_require__(12);

/**
 * GET /upstreams/{name}/slices
 */
function getUpstreamSlices(req, res, next) {
  const upstreamName = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;
  const active = req.swagger.params.active.value;

  return getSlices({ environmentName, upstreamName, active }).then(data => res.json(data)).catch(next);
}

/**
 * PUT /upstreams/{name}/slices/toggle
 */
function putUpstreamSlicesToggle(req, res, next) {
  const upstreamName = req.swagger.params.name.value;
  const activeSlice = req.swagger.params.active.value;
  const environmentName = req.swagger.params.environment.value;
  const user = req.user;

  const command = metadata.addMetadata({ environmentName, upstreamName, activeSlice, user });
  return toggleSlices(command)
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/upstreams/${upstreamName}/slices/toggle`,
          Method: 'PUT',
          Parameters: [
            {
              Name: 'upstream',
              Type: 'path',
              Value: upstreamName || ''
            },
            {
              Name: 'environment',
              Type: 'query',
              Value: environmentName || ''
            },
            {
              Name: 'active',
              Type: 'query',
              Value: activeSlice || ''
            }
          ]
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: upstreamName,
        Environment: environmentName,
        ActiveSlice: activeSlice
      }
    }))
    .catch(next);
}

module.exports = {
  getUpstreamSlices,
  putUpstreamSlicesToggle
};


/***/ }),
/* 365 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let getSlices = __webpack_require__(140);
let loadBalancerUpstreams = __webpack_require__(38);

module.exports = function GetSlicesByUpstream(query) {
  assert.equal(typeof query.environmentName, 'string');
  assert.equal(typeof query.upstreamName, 'string');

  return loadBalancerUpstreams.inEnvironmentWithUpstream(query.environmentName, query.upstreamName)
    .then(upstreams => getSlices.handleQuery(query, upstreams));
};


/***/ }),
/* 366 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let assert = __webpack_require__(3);
let {
  orchestrate,
  ToggleUpstreamByNameVerifier,
  UpstreamProvider,
  UpstreamToggler
 } = __webpack_require__(141);
let sender = __webpack_require__(6);
let Environment = __webpack_require__(9);

module.exports = function ToggleSlicesByUpstream(command) {
  assert.equal(typeof command.environmentName, 'string');
  assert.equal(typeof command.upstreamName, 'string');

  return Environment.getAccountNameForEnvironment(command.environmentName).then((account) => {
    command.accountName = account;

    let resourceName = `Upstream named "${command.upstreamName}" in "${command.environmentName}" environment`;
    let provider = UpstreamProvider(sender, command, resourceName);
    let verifier = ToggleUpstreamByNameVerifier(resourceName);
    let toggler = UpstreamToggler(sender, command);

    return orchestrate(provider, verifier, toggler);
  });
};


/***/ }),
/* 367 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);
let ms = __webpack_require__(42);
let userService = __webpack_require__(50);
let utils = __webpack_require__(51);
let cookieConfiguration = __webpack_require__(72);

/**
 * POST /login
 */
function login(req, res, next) {
  return co(function* () {
    let body = req.swagger.params.body.value;
    let duration = cookieConfiguration.getCookieDuration();

    let credentials = {
      username: body.username,
      password: body.password,
      scope: 'ui'
    };

    let token = yield userService.authenticateUser(credentials, duration);
    let cookieName = cookieConfiguration.getCookieName();
    let cookieValue = token;
    let cookieOptions = { expires: utils.offsetMilliseconds(new Date(), ms(duration)) };

    res.cookie(cookieName, cookieValue, cookieOptions);
    res.send(token);
  }).catch(next);
}

/**
 * POST /logout
 */
function logout(req, res, next) {
  let cookieName = cookieConfiguration.getCookieName();
  let token = req.cookies[cookieName];

  return userService.signOut(token).then(() => {
    res.clearCookie(cookieName);
    res.json({ ok: true });
  }).catch(next);
}

module.exports = {
  login,
  logout
};


/***/ }),
/* 368 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



const os = __webpack_require__(369);
let config = __webpack_require__(5);
let _ = __webpack_require__(1);

const APP_VERSION = config.get('APP_VERSION');
const IS_REMOTE_DEBUG = config.get('IS_REMOTE_DEBUG');
const links = config.getUserValue('local').content.links;
const FEATURE_DISABLE_SERVICE = true;

function getIP() {
  try {
    return _.chain(os.networkInterfaces())
      .values()
      .flatten()
      .find({ family: 'IPv4', internal: false })
      .value()
      .address;
  } catch (error) {
    return '127.0.0.1';
  }
}

/**
 * This is JSONP with initial state of an app, if user is not logged in, no need to send any information.
 * User will see a login form.
 */
module.exports = function getInitialData(request, response) {
  let str = '';
  str += `window.version = '${APP_VERSION}'; `;
  str += `window.FEATURE_DISABLE_SERVICE = ${FEATURE_DISABLE_SERVICE}; `;

  if (request.user !== undefined) {
    let userJson = JSON.stringify(request.user.toJson());
    str += `window.links = ${JSON.stringify(links)}; `;
    str += `window.user = new User(${userJson}); `;
  }

  if (IS_REMOTE_DEBUG) {
    const DEBUG_PORT = config.get('DEBUG_PORT');
    const IP = getIP();
    str += `window.remoteDebugger='${IP}:${DEBUG_PORT}'; `;
  }

  response.send(str);
};


/***/ }),
/* 369 */
/***/ (function(module, exports) {

module.exports = require("os");

/***/ }),
/* 370 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let config = __webpack_require__(5);
const Ssl = __webpack_require__(371);
const NoSsl = __webpack_require__(372);
let implementation;

if (config.get('IS_PRODUCTION') && !config.get('USE_HTTP')) {
  implementation = new Ssl();
} else {
  implementation = new NoSsl();
}

module.exports = implementation;


/***/ }),
/* 371 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let https = __webpack_require__(134);
const SslComponentsRepository = __webpack_require__(96);

module.exports = function HttpsServerFactory() {
  let sslComponentsRepository = new SslComponentsRepository();

  this.create = function (application, parameters) {
    return sslComponentsRepository.get().then(
      sslComponents => new Promise((resolve) => {
        let port = parameters.port;
        let server = createServerByApplicationAndSslComponents(
          application, sslComponents
        );

        server.listen(port, () => resolve(server));
      })
    );
  };

  function createServerByApplicationAndSslComponents(application, sslComponents) {
    let options = {
      key: sslComponents.privateKey,
      cert: sslComponents.certificate
    };

    let server = https.createServer(options, application);
    return server;
  }
};


/***/ }),
/* 372 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let http = __webpack_require__(133);

function HttpServerFactory() {
  this.create = function (application, parameters) {
    return new Promise((resolve) => {
      let port = parameters.port;
      let server = http.createServer(application);
      server.listen(port, () => resolve(server));
    });
  };
}

module.exports = HttpServerFactory;


/***/ }),
/* 373 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

/**
 * Express Middleware to log requests and errors
 */



const fp = __webpack_require__(4);
const miniStack = __webpack_require__(93);

let redactSecrets = fp.cloneDeepWith((value, key) => (/password/i.test(key) ? '********' : undefined));

let swaggerParams = fp.flow(
  fp.get(['swagger', 'params']),
  fp.mapValues(({ value }) => value),
  redactSecrets
);

let getUser = fp.compose(
  f => (fp.isFunction(f) ? f() : null),
  fp.get(['user', 'getName'])
);

let tryParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return undefined;
  }
};

let mini = miniStack.build();

let loggerMiddleware = logger => (req, res, next) => {
  let log = () => {
    let deprecated = fp.compose(fp.defaultTo(false), fp.get(['locals', 'deprecated']))(res);
    let message = deprecated ? 'HTTP request deprecated' : 'HTTP request';
    let statusCode = fp.get(['statusCode'])(res);
    let level = (() => {
      if (statusCode >= 500) {
        return 'error';
      } else if (statusCode >= 400 || deprecated) {
        return 'warn';
      } else {
        return 'debug';
      }
    })();
    let responseFields = (() => {
      if (statusCode < 400) {
        return ['statusCode'];
      } else {
        return ['statusCode', 'body'];
      }
    })();
    let entry = {
      eventtype: 'http',
      req: {
        headers: {
          'user-agent': fp.get(['headers', 'user-agent'])(req)
        },
        id: fp.get('id')(req),
        ip: fp.get('ip')(req),
        method: fp.get('method')(req),
        originalUrl: fp.get('originalUrl')(req),
        params: req.originalUrl === '/api/token' ? redactSecrets(req.body) : swaggerParams(req)
      },
      res: fp.pick(responseFields)(res),
      user: req.originalUrl === '/api/token' ? fp.get(['body', 'username'])(req) : getUser(req)
    };
    logger.log(level, message, entry);
  };
  let send = res.send;
  res.send = (content) => {
    if (content) {
      let s = content.toString();
      res.body = tryParse(s) || s;
    }
    log();
    send.call(res, content);
  };
  next();
};

let errorLoggerMiddleware = logger => (err, req, res, next) => {
  let log = () => {
    let message = 'HTTP error';
    let entry = {
      error: {
        message: fp.get(['message'])(err),
        stack: fp.compose(fp.truncate({ length: 1400 }), mini, fp.get(['stack']))(err)
      },
      eventtype: 'http error',
      req: {
        id: fp.get('id')(req),
        method: fp.get('method')(req),
        ip: fp.get('ip')(req),
        originalUrl: fp.get('originalUrl')(req),
        params: swaggerParams(req)
      },
      user: getUser(req)
    };
    logger.error(message, entry);
  };
  res.once('close', log);
  res.once('finish', log);
  next(err);
};

module.exports = {
  loggerMiddleware,
  errorLoggerMiddleware
};


/***/ }),
/* 374 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

/**
 * Express middleware that adds deprecated=true to a request and sets the Warning HTTP header
 * on the response if it is a request to a deprecated route.
 */



function create(fn) {
  return function deprecateMiddleware(req, res, next) {
    try {
      let warning = fn(req);
      if (warning) {
        let now = new Date().toUTCString();
        res.locals.deprecated = true;
        res.append('Warning', `299 - Deprecated: ${warning} "${now}"`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = create;


/***/ }),
/* 375 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let express = __webpack_require__(70);
let router = express.Router();
let assert = __webpack_require__(3);
let remoteCacheFlush = __webpack_require__(376);
let cookieAuthentication = __webpack_require__(98);
let logger = __webpack_require__(2);

router.post('/:environment', (req, res) => {
  assert(req.body.hosts);

  const hosts = req.body.hosts;
  const environment = req.params.environment;

  cookieAuthentication.middleware(req, res, () => 0)
    .then(() => {
      logger.info(`Request to reset cache in ${environment} by user ${req.user.getName()}`);
      return remoteCacheFlush.flush(environment, hosts)
        .then(results => res.status(200).json(results));
    })
    .catch(e => res.status(400).send('[cachereset::error]:', e.message));
});

module.exports = {
  router
};


/***/ }),
/* 376 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let consulClient = __webpack_require__(44);
let _ = __webpack_require__(1);
let request = __webpack_require__(138).defaults({ strictSSL: false });
let logger = __webpack_require__(2);
let configEnvironments = __webpack_require__(18);
let config = __webpack_require__(5);

function flush(environment, hosts) {
  let consulClientInstance;
  let token;

  return consulClient.create({ environment, promisify: true })
    .then(storeInstance)
    .then(() => {
      return getToken(environment)
        .then((tokenValue) => {
          token = tokenValue;
        });
    })
    .then(getServicesInEnvironment)
    .then(convertServiceObjectToListOfServices)
    .then(getNodesForServices)
    .then(createAddresses(hosts))
    .then((addresses) => { return sendRequestToAddresses(token, addresses); })
    .then((results) => {
      return consulClientInstance.kv.set(`environments/${environment}/cacheTimestamp`, Date.now().toString())
        .then(() => {
          results.unshift({ status: 'success', message: 'Consul Cache Updated' });
          return results;
        });
    })
    .catch((e) => {
      logger.error('Cache Reset Error: ', e);
      return { error: e.message };
    });

  function storeInstance(instance) {
    consulClientInstance = instance;
  }

  function getServicesInEnvironment() {
    return consulClientInstance.catalog.service.list();
  }

  function convertServiceObjectToListOfServices(services) {
    if (services) return Object.keys(services).map(s => s);
    else return [];
  }

  function getNodesForServices(serviceList) {
    // [ service: listOfNodesInService ]
    return Promise.all(serviceList.map((s) => {
      return consulClientInstance.catalog.service.nodes(s);
    }));
  }
}

function stripPrefix(value) {
  let prefixes = ['/^upstream_/', '/^slice_/'];
  let result = '';
  prefixes.forEach((p) => {
    result = value.replace(p, '');
  });
  return result;
}


function createAddresses(hosts) {
  return (nodesLists) => {
    let addresses = [];
    _.flatten(hosts).forEach((host) => {
      let nodes = _.flatten(nodesLists).filter((n) => {
        // todo: Configuration String endpoint to store these ignore strings
        return stripPrefix(n.ServiceName).toLowerCase() === host.host.toLowerCase();
      });
      if (nodes) {
        nodes.forEach((node) => {
          let ip = node.Address;
          addresses.push({
            Address: `https://${ip}:${host.port}/diagnostics/cachereset`,
            Host: host.host,
            ServiceName: node.ServiceName
          });
        });
      }
    });
    return addresses;
  };
}

const stripToken = (options) => {
  if (options.body && options.body.token && !options.body.token.startsWith('[No Cache Reset Key Found]')) {
    delete options.body.token;
  }
  return options;
};

function sendRequestToAddresses(token, addresses) {
  let results = [];

  addresses.forEach((address) => {
    let options = {
      method: 'POST',
      uri: address.Address,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000,
      body: {
        token
      },
      json: true,
      metadata: {
        Host: address.Host,
        ServiceName: address.ServiceName
      }
    };

    results.push(new Promise((resolve) => {
      request.post(options, (error, response) => {
        if (response && response.statusCode === 401) {
          let message = `401 received: ${JSON.stringify(stripToken(options))}`;
          let result = ({ status: 'info', message });
          resolve(result);
          logger.error(message);
        } else if (response && response.statusCode === 200) {
          let message = `'200 received: ${JSON.stringify(stripToken(options))}`;
          let result = ({ status: 'success', message });
          logger.info(message);
          resolve(result);
        } else {
          let message = `'Non 200-401 received: ${JSON.stringify(stripToken(options))}`;
          let result = ({ status: 'default', message });
          logger.info(message);
          resolve(result);
        }
      });
    }));
  });

  return Promise.all(results);
}

function getToken(EnvironmentName) {
  let key = { EnvironmentName };
  return configEnvironments.get(key)
    .then(getEnvironmentTypeValue)
    .then(getCacheResetKeyForEnvironment);

  function getEnvironmentTypeValue(environment) {
    return environment.Value.EnvironmentType;
  }

  function getCacheResetKeyForEnvironment(environmentType) {
    try {
      let value = config.getUserValue('local').CacheReset[environmentType].plain;
      return value;
    } catch (e) {
      return `[No Cache Reset Key Found] :: ${environmentType}`;
    }
  }
}

module.exports = {
  flush
};


/***/ }),
/* 377 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let express = __webpack_require__(70);
let co = __webpack_require__(0);
let _ = __webpack_require__(1);

let healthChecks = __webpack_require__(378);

let statusCodes = _.fromPairs([
  [healthChecks.resultCodes.SUCCESS, 200],
  [healthChecks.resultCodes.FAIL, 500]
]);

function buildRouter() {
  let router = express.Router();
  healthChecks.checks.forEach((check) => {
    let middleware = toMiddleware(check.run);
    router.get(check.url, middleware);
  });
  return router;
}

function toMiddleware(check) {
  return (req, res) => {
    co(function* () {
      let checkReport = yield runCheck(check);
      let statusCode = statusCodes[checkReport.result];
      res.status(statusCode).json(checkReport);
    });
  };
}

function runCheck(check) {
  try {
    return check().catch(err => errorResult(err));
  } catch (err) {
    return Promise.resolve(errorResult(err));
  }
}

function errorResult(error) {
  return {
    result: healthChecks.resultCodes.FAIL,
    reason: 'An error occurred',
    error: {
      message: error.message,
      stack: error.stack
    }
  };
}

module.exports = {
  router: buildRouter()
};


/***/ }),
/* 378 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let resultCodes = __webpack_require__(86);
const ping = __webpack_require__(379);
const redis = __webpack_require__(380);

let checks = [
  ping,
  redis
  // ... add more health checks here
];

module.exports = {
  resultCodes,
  checks
};


/***/ }),
/* 379 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let HealthCheckResults = __webpack_require__(86);

module.exports = {
  url: '/ping',
  run: () => {
    return Promise.resolve({
      result: HealthCheckResults.SUCCESS
    });
  }
};


/***/ }),
/* 380 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let co = __webpack_require__(0);

let HealthCheckResults = __webpack_require__(86);
let UserSessionStore = __webpack_require__(95);

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


/***/ }),
/* 381 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let config = __webpack_require__(5);
let renderer = __webpack_require__(382);

const PUBLIC_DIR = config.get('PUBLIC_DIR');

renderer.register('home', `${PUBLIC_DIR}/index.html`);

module.exports = function (request, response) {
  renderer.render('home', {}, content => response.send(content));
};


/***/ }),
/* 382 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
/* eslint-disable */
/**
 * TODO: This file needs some attention/simplifying
 * Ignoring eslint until then.
 */


let fileSystem = __webpack_require__(27);
let compiler = __webpack_require__(383);
let resolver = __webpack_require__(384);

let templateCatalog = [];

function Template(name, path) {
  let _name = name;
  let _path = path;
  let _template = null;

  function getPath() { return _path; }

  function getTemplate() { return _template; }

  function setTemplate(value) { _template = value; }

  function render(data, callback) {
    let executeTemplating = function () {
      let result = resolver(getTemplate(), data);
      callback(result);
    };

    if (getTemplate()) {
      executeTemplating();
    } else {
      fileSystem.readFile(getPath(), 'utf8', (error, content) => {
        if (error) throw error;

        setTemplate(compiler(content));
        executeTemplating();
      });
    }
  }

  return {
    render,
  };
}

module.exports = {
  register(name, path) {
    templateCatalog[name] = new Template(name, path);
  },
  render(name, data, callback) {
    templateCatalog[name].render(data, callback);
  },
};


/***/ }),
/* 383 */
/***/ (function(module, exports) {

module.exports = require("es6-template-strings/compile");

/***/ }),
/* 384 */
/***/ (function(module, exports) {

module.exports = require("es6-template-strings/resolve-to-string");

/***/ }),
/* 385 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */



let url = __webpack_require__(63);
let sender = __webpack_require__(6);
let logger = __webpack_require__(2);
let GetNodeDeploymentLog = __webpack_require__(126);

module.exports = (request, response) => {
  let params = url.parse(request.url, true).query;

  let query = {
    name: 'GetNodeDeploymentLog',
    accountName: params.account,
    environment: params.environment,
    deploymentId: params.deploymentId,
    instanceId: params.node
  };

  sender.sendQuery(GetNodeDeploymentLog, { query, user: request.user }).then((data) => {
    response.send(data.replace(/\n/g,  '<br />'));
  }).catch((err) => {
    response.status(500).send('An error occurred. The log file might not be available. Please see logs for more details.');
    logger.error('Error fetching node deployment log file.', err);
  });
};


/***/ })
/******/ ]);
//# sourceMappingURL=server.js.map