'use strict';

/* Use an SNS topic to trigger this Lambda function.
 */

const AWS = require('aws-sdk');
const batchSize = 25;
const crypto = require('crypto');
const sourceTable = 'InfraChangeAudit';
const destinationTable = 'InfraChangeAudit';
// Set destinationAccount = undefined to use the same account as the source.
const destinationAccount = '499033042897';

function display(obj) {
  return JSON.stringify(obj);
}

function awsPromise(op) {
  return (service, params) =>
        new Promise(function (resolve, reject) {
          service[op](params, function (error, data) {
            if (error) {
              reject(error);
            } else {
              resolve(data);
            }
          });
        });
}

function uuid() {
  function chunk(sizes, str) {
    function loop(chunkNumber, chunkStartIdx, acc) {
      if (chunkNumber >= sizes.length) {
        return acc;
      }
      if (chunkStartIdx >= str.length) {
        return acc;
      }
      let nextChunkStartIdx = chunkStartIdx + sizes[chunkNumber];
      acc.push(str.substring(chunkStartIdx, nextChunkStartIdx));
      return loop(chunkNumber + 1, nextChunkStartIdx, acc);
    }
    return loop(0, 0, []);
  }

  let s = crypto.randomBytes(16).toString('hex');
  return chunk([8, 4, 4, 4, 12], s).join('-');
}

function getAuditWriterCredentials(roleArn) {
  let sts = new AWS.STS({ apiVersion: '2011-06-15' });
  let params = {
    RoleArn: roleArn,
    RoleSessionName: uuid(),
    DurationSeconds: 900
  };
  return awsPromise('assumeRole')(sts, params)
        .then(rsp => new AWS.Credentials({
          accessKeyId: rsp.Credentials.AccessKeyId,
          secretAccessKey: rsp.Credentials.SecretAccessKey,
          sessionToken: rsp.Credentials.SessionToken
        }));
}

function getDynamoClientWithCredentials(credentials) {
  let dynamodb = new AWS.DynamoDB({ apiVersion: '2012-08-10', credentials: credentials });
  let documentClient = new AWS.DynamoDB.DocumentClient({ service: dynamodb });
  return documentClient;
}

function main(event, context, callback) {
  let succeed = x => callback(null, x);
  let fail = x => callback(x);

  function init() {
    function bind(name) {
      return function (value) {
        let x = {};
        x[name] = value;
        return x;
      }
    }

    let sts = new AWS.STS({ apiVersion: '2011-06-15' }); 
    let currentAccount = awsPromise('getCallerIdentity')(sts, {}).then(rsp => rsp.Account);

    let actions = [
      currentAccount.then(bind('account')),
      currentAccount.then(account => `arn:aws:iam::${destinationAccount || account}:role/roleInfraEnvironmentManagerAuditWriter`)
                .then(getAuditWriterCredentials)
                .then(getDynamoClientWithCredentials)
                .then(bind('targetDynamoDb')),
      Promise.resolve(new AWS.DynamoDB.DocumentClient()).then(bind('sourceDynamoDb')),
      Promise.resolve(new AWS.SNS({ apiVersion: '2010-03-31' })).then(bind('sns'))
    ];
    return Promise.all(actions).then(results => results.reduce((acc, cur) => Object.assign(acc, cur), {}));
  }

  function run(initData) {
    let account = initData.account;
    let snsTopicArn = event.Records[0].Sns.TopicArn;
    let message = JSON.parse(event.Records[0].Sns.Message);

    function readBatchFromSource(exclusiveStartKey) {
      console.log(`Started reading at ${display(exclusiveStartKey)}.`)
      let params = {
        TableName: sourceTable,
        Limit: batchSize
      };
      if (exclusiveStartKey) {
        params.ExclusiveStartKey = exclusiveStartKey;
      }
      return awsPromise('scan')(initData.sourceDynamoDb, params);
    }

    function transformEachItem(dynamoDbResponse) {
      function transform(item) {
        let timestamp = item.ISOTimestamp;
        let date = timestamp.substr(0, 10);
        let source = `arn:aws:dynamodb:eu-west-1:${account}:table/${item.Entity.Type}`

        if (!item.Date) {
          item.Date = date;
        }
        if (!item.Source) {
          item.Source = source;
        }
        return item;
      }

      return dynamoDbResponse.Items.map(transform);
    }


    function writeBatchToDestination(items) {
      function loop(remainingItems) {
        if (remainingItems && remainingItems.length > 0) {
          let params = batchWrite(table(destinationTable, remainingItems)); 
          return awsPromise('batchWrite')(initData.targetDynamoDb, params)
                        .then(result => batchWrite(result.RequestItems))
                        .then(loop);
        } else {
          return Promise.resolve();
        }
      }

      function table(tableName, items) {
        let x = {};
        x[tableName] = items;
        return x;
      }
      function put(item) {
        return {
          PutRequest: {
            Item: item
          }
        };
      }
      function batchWrite(requestItems) {
        return {
          RequestItems: requestItems
        };
      }

      return loop(items.map(put));
    }

    function publishContinuation(exclusiveStartKey) {
      console.log(`Finished processing batch. Last processed item: ${display(exclusiveStartKey)}`);
      let params = {
        Message: JSON.stringify({ ExclusiveStartKey: exclusiveStartKey }),
        TargetArn: snsTopicArn
      }
      return awsPromise('publish')(initData.sns, params);
    }

    function processBatch(dynamoDbResponse) {
      let nextExclusiveStartKey = dynamoDbResponse.LastEvaluatedKey;
      console.log(`Started processing batch. Last item: ${display(nextExclusiveStartKey)}`);
      function halt() {
        console.log(`Finished processing table ${sourceTable}`)
        return Promise.resolve();
      }
      let continueWithNextBatch = publishContinuation.bind(null, nextExclusiveStartKey);
      let continueOrHalt = nextExclusiveStartKey ? continueWithNextBatch : halt;
      return Promise.resolve(transformEachItem(dynamoDbResponse))
                .then(writeBatchToDestination)
                .then(continueOrHalt);
    }

    return readBatchFromSource(message.ExclusiveStartKey)
            .then(processBatch)
            .then(succeed, fail);
  }

  console.log('starting');

  return init().then(run).then(succeed, fail);
}

module.exports = { handler: main };