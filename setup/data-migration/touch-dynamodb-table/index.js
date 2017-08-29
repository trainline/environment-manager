/* eslint-disable no-console */

'use strict';

const AWS = require('aws-sdk');
const { env: {
  BATCH_SIZE,
  TABLE
} } = require('process');


function reduceG(fn, [initAcc, initGenArg], gen) {
  function loop(accP, genResultP) {
    return Promise.resolve(genResultP)
      .then((genResult) => {
        if (genResult === undefined) {
          return accP;
        } else {
          return Promise.resolve(accP)
            .then(acc => fn(acc, genResult))
            .then(([nextAcc, nextGenArg]) => loop(nextAcc, gen(nextGenArg)));
        }
      });
  }
  return loop(initAcc, gen(initGenArg));
}

function reduceP(fn, init, items) {
  function loop(promise, [head, ...tail]) {
    if (head === undefined) {
      return promise;
    }
    return loop(promise.then(acc => fn(acc, head)), tail);
  }
  return loop(Promise.resolve(init), items);
}

function mapSeqP(fn, items) {
  return reduceP(([...acc], nxt) => Promise.resolve(fn(nxt)).then(x => [...acc, x]), [], items);
}

function read(dynamo, keyattrs, ExclusiveStartKey) {
  console.error(ExclusiveStartKey);
  if (ExclusiveStartKey === undefined) {
    return Promise.resolve();
  }
  let params = Object.assign(
    {
      TableName: TABLE,
      Limit: BATCH_SIZE,
      ProjectionExpression: keyattrs.map(attr => `#${attr}`).join(','),
      ExpressionAttributeNames: Object.assign(...keyattrs.map(attr => ({ [`#${attr}`]: attr })))
    },
    ExclusiveStartKey ? { ExclusiveStartKey } : {}
  );
  return dynamo.scan(params).promise()
    .catch(e => {
      console.error(`An error occurred while reading records: ExclusiveStartKey=${JSON.stringify(ExclusiveStartKey)}`);
      return Promise.reject(e);
    });
}

function update(dynamo, Key) {
  return dynamo.updateItem({
    TableName: TABLE,
    Key,
    UpdateExpression: 'SET #Audit.#Version = #Audit.#Version + :incr',
    ExpressionAttributeNames: {
      '#Audit': 'Audit',
      '#Version': 'Version'
    },
    ExpressionAttributeValues: {
      ':incr': { "N": "1" }
    }
  }).promise()
    .then(() => {
      console.error(`Updated record: ${JSON.stringify(Key)}`);
      return Key;
    })
    .catch(e => {
      console.error(`An error occurred while updating the record: ${JSON.stringify(Key)}`);
      return Promise.reject(e);
    });
}

let dynamo = new AWS.DynamoDB();
function handler(event, context, callback) {
  let { ExclusiveStartKey = null } = event;
  return dynamo.describeTable({ TableName: TABLE }).promise()
    .then(({ Table: { KeySchema } }) => KeySchema.map(x => x.AttributeName))
    .then(keyattrs => reduceG(
      ([...acc], readResult) => {
        let { Items = [] } = readResult || {};
        return mapSeqP(update.bind(null, dynamo), Items)
          .then(writeResults => [[...acc, ...writeResults], readResult.LastEvaluatedKey]);
      },
      [[], ExclusiveStartKey],
      exclusiveStartKey => read(dynamo, keyattrs, exclusiveStartKey)))
    .then(data => callback(null, data))
    .catch(error => callback(error));
}

module.exports = {
  handler,
  reduceG
};
