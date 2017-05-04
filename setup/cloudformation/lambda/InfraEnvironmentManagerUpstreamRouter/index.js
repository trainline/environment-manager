'use strict';

let AWS = require('aws-sdk');

let { formatItem, parseItem } = (function dynamoDbConverter() {

  let mapObj = (f, o) => Object.keys(o).reduce((acc, k) => { acc[k] = f(o[k]); return acc; }, {});

  function withErrorHandler(fn) {
    let errorFlag = false;
    let error = (msg, val) => { errorFlag = true; return [[`Error: ${msg}`, val], null]; };
    return obj => {
      let result = fn(error, obj)
      if (errorFlag) {
        throw new Error(`Conversion error: ${JSON.stringify(result, null, 2)}`);
      } else {
        return result;
      }
    };
  }

  function parsePrimitive(error, obj) {
    let keys = Object.keys(obj);
    let recur = parsePrimitive.bind(null, error);
    if (keys.length === 1) {
      let [key] = keys;
      let val = obj[key];
      switch (key) {
        case 'B':
        case 'BB':
          return error(`Unsupported type discriminator: ${key}`)
        case 'BOOL': return typeof (val) === 'boolean' ? val : error('Expected a boolean', val);
        case 'L': return Array.isArray(val) ? val.map(recur) : error('Expected an array', val);
        case 'M': return typeof (val) === 'object' && val !== null ? mapObj(recur, val) : error('Expected an object', val);
        case 'N': return typeof (val) === 'number' || typeof (val) === 'string' ? Number(val) : error('Expected a number or string', val);
        case 'NULL': return null;
        case 'S': return typeof (val) === 'string' ? val : error('Expected a string', val);
        case 'SS': return Array.isArray(val) ? new Set(val.map(x => recur({ S: x }))) : error('Expected an array', val);
        case 'NN': return Array.isArray(val) ? new Set(val.map(x => recur({ N: x }))) : error('Expected an array', val);
        default: return error(`Invalid type discriminator: ${key}`);
      }
    } else {
      return error('Expected an object with one property', obj);
    }
  }

  function formatPrimitive(error, obj) {
    let recur = formatPrimitive.bind(null, error);
    let type = typeof obj
    switch (type) {
      case 'boolean':
        return { BOOL: obj };
      case 'function':
        return error('Unsupported value', obj);
      case 'number':
        return { N: obj };
      case 'string':
        return { S: obj };
      case 'object':
        if (obj === null) {
          return { NULL: true };
        } else if (obj instanceof Array) {
          return { L: obj.map(recur) }
        } else if (obj instanceof Set) {
          let items = Array.from(obj);
          let itemType = (([x, ...xs]) => xs.reduce((a, y) => { let t = typeof y; return a === t ? a : 'undefined' }, typeof x))(items);
          if (itemType === 'number') {
            return { NN: items };
          } else if (itemType === 'string') {
            return { SS: items };
          } else {
            return { L: items.map(recur) };
          }
        } else {
          return { M: mapObj(recur, obj) };
        }
      case 'symbol':
        return error('Unsupported value', obj);
      case 'undefined':
        return error('Unsupported value', obj);
    }
  }

  return {
    formatItem(obj) {
      if (typeof obj !== 'object' || obj === null) {
        throw new Error('Expected an object')
      }
      let result = withErrorHandler(formatPrimitive)(obj);
      return result.M;
    },

    parseItem(obj) {
      let result = withErrorHandler(parsePrimitive)({ M: obj });
      return result;
    }
  }
})();

function show(x) {
  return JSON.stringify(x);
}

function reduceSeq(fn, [x, ...xs], acc) {
  return x === undefined
    ? Promise.resolve(acc)
    : Promise.resolve(acc)
      .then(a => Promise.resolve(fn(a, x)))
      .then(a => reduceSeq(fn, xs, a));
}

function mapSeq(fn, array) {
  return reduceSeq((acc, nxt) => Promise.resolve(fn(nxt)).then(x => [...acc, x]), array, []);
}

function memoize(fn) {
  let memo = new Map();
  return (...args) => {
    let key = JSON.stringify(args);
    if (!memo.has(key)) {
      let result = fn(...args);
      memo.set(key, result);
    }
    return memo.get(key);
  };
}

let fromPairs = (acc, [k, v]) => { acc[k] = v; return acc; };
let toPairs = obj => Object.keys(obj).map(k => [k, obj[k]]);

function convertToOldModel(item) {
  let value = toPairs(parseItem(item))
    .filter(([k, v]) => [
      'Environment',
      'Hosts',
      'LoadBalancingMethod',
      'PersistenceMethod',
      'SchemaVersion',
      'Service',
      'SlowStart',
      'Upstream',
      'UpStreamKeepalives',
      'ZoneSize'
    ].some(x => x === k) && v !== undefined)
    .map(([k, v]) => [{
      Environment: 'EnvironmentName',
      Service: 'ServiceName',
      Upstream: 'UpstreamName'
    }[k] || k, v])
    .reduce(fromPairs, {});

  let deleteMarker = item.__Deleted ? { __Deleted: item.__Deleted } : {}

  return Object.assign({
    Audit: item.Audit,
    key: item.Key,
    value: {
      S: JSON.stringify(value)
    },
    version: item.Audit.M.Version,
    readonly: { BOOL: true }
  }, deleteMarker);
}

function convertToNewModel(item, accountForEnvironment) {
  let parsedValue = JSON.parse(item.value.S)
  let accountId = accountForEnvironment(parsedValue.EnvironmentName)
  return Object.assign(
    {
      AccountId: { S: accountId },
      LoadBalancerGroup: { S: accountId }
    },
    toPairs(item)
      .filter(([k, v]) => [
        '__Deleted',
        'Audit',
        'key',
      ].some(x => x === k && v !== undefined))
      .map(([k, v]) => [{
        key: 'Key',
      }[k] || k, v])
      .reduce(fromPairs, {}),
    formatItem(
      toPairs(parsedValue)
        .filter(([k, v]) => [
          'EnvironmentName',
          'Hosts',
          'LoadBalancingMethod',
          'PersistenceMethod',
          'SchemaVersion',
          'ServiceName',
          'SlowStart',
          'UpstreamName',
          'UpStreamKeepalives',
          'ZoneSize'
        ].some(x => x === k) && v !== undefined)
        .map(([k, v]) => [{
          EnvironmentName: 'Environment',
          ServiceName: 'Service',
          UpstreamName: 'Upstream'
        }[k] || k, v])
        .reduce(fromPairs, {})
    ));
}

function parseFunctionArn(functionArn) {
  let match = /^arn:aws:lambda:([^:]+):([^:]+):function:(.*)/.exec(functionArn);
  if (match !== null && match.length > 1) {
    return {
      region: match[1],
      accountId: match[2],
      functionName: match[3]
    };
  }
  throw new Error('Could not determine AWS account from context object.');
}

exports.convertToNewModel = convertToNewModel;
exports.convertToOldModel = convertToOldModel;
exports.formatItem = formatItem;
exports.parseItem = parseItem;
exports.handler = (event, context, callback) => {

  const DESTINATION_TABLE = process.env.DESTINATION_TABLE;
  const ROLE_NAME = process.env.ROLE_NAME;

  const {
        accountId: myAccountId,
    functionName
    } = parseFunctionArn(context.invokedFunctionArn);

  let getCredentialsForAccount = memoize((accountId) => {
    if (accountId === myAccountId) {
      return Promise.resolve({});
    }
    let sts = new AWS.STS();
    let params = {
      RoleArn: `arn:aws:iam::${accountId}:role/${ROLE_NAME}`,
      RoleSessionName: functionName,
      DurationSeconds: 900
    };
    return sts.assumeRole(params).promise().then(({ Credentials: { AccessKeyId, SecretAccessKey, SessionToken } }) =>
      ({
        credentials: new AWS.Credentials({
          accessKeyId: AccessKeyId,
          secretAccessKey: SecretAccessKey,
          sessionToken: SessionToken
        })
      }));
  });

  function deleteRecord(record) {
    console.log(`DELETE ${show(record.dynamodb.Keys)}`);
    return Promise.resolve()
      .then(() => getCredentialsForAccount(record.dynamodb.OldImage.AccountId.S))
      .then(credentials => new AWS.DynamoDB(credentials))
      .then(dynamo => {
        let params = {
          Key: {
            key: record.dynamodb.Keys.Key
          },
          TableName: DESTINATION_TABLE
        }
        return dynamo.deleteItem(params).promise()
      })
      .catch(error => { console.error(`Error deleting record: ${record}`); return Promise.reject(error); });
  }

  function putRecord(record) {
    console.log(`PUT ${show(record.dynamodb.Keys)}`);
    return Promise.resolve()
      .then(() => getCredentialsForAccount(record.dynamodb.NewImage.AccountId.S))
      .then(credentials => new AWS.DynamoDB(credentials))
      .then(dynamo => dynamo.putItem({
        Item: convertToOldModel(record.dynamodb.NewImage),
        TableName: DESTINATION_TABLE,
        ConditionExpression: '#Audit.#Version < :version or attribute_not_exists(#key)',
        ExpressionAttributeNames: {
          '#Audit': 'Audit',
          '#key': 'key',
          '#Version': 'Version'
        },
        ExpressionAttributeValues: {
          ':version': record.dynamodb.NewImage.Audit.M.Version
        }
      }).promise().catch(error => (error.code === 'ConditionalCheckFailedException' ? Promise.resolve() : Promise.reject(error))))
      .catch(error => { console.error(`Error putting record: ${record}`); return Promise.reject(error); });
  }

  function processRecord(record) {
    let { eventName } = record;
    switch (eventName) {
      case 'INSERT':
      case 'MODIFY':
        return putRecord(record).then(() => ({ PUT: record.dynamodb.Keys }));
      case 'REMOVE':
        return deleteRecord(record).then(() => ({ DELETE: record.dynamodb.Keys }));
      default:
        return Promise.reject(`Unsupported eventName: ${eventName}`);
    }
  }

  Promise.resolve()
    .then(mapSeq(processRecord, event.Records))
    .then(data => callback(null, data))
    .catch(error => callback(error));
};