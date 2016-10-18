'use strict';

const AWS = require('aws-sdk');
const dynamodbExpression = require('modules/awsDynamo/dynamodbExpression');
const Promise = require('bluebird');
const awsResourceNameProvider = require('modules/awsResourceNameProvider');
const qname = awsResourceNameProvider.getTableName;
const InfraChangeAudit = qname('InfraChangeAudit');
const InfraChangeAuditIndexName = 'Date-ISOTimestamp-index';
const LocalDate = require('js-joda').LocalDate;

function createQuery(date, limit, options, exclusiveStartKey) {
  let expressions = {
    KeyConditionExpression: ['=', ['attr', 'Date'], ['val', date]],
  };
  if (options.filter) {
    expressions.FilterExpression = options.filter;
  }
  let compiledExpressions = dynamodbExpression.compile(expressions);
  let t = {
    TableName: InfraChangeAudit,
    IndexName: InfraChangeAuditIndexName,
    Limit: limit,
    ScanIndexForward: false,
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
    ISOTimestamp: item.ISOTimestamp,
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

  let documentClient = Promise.promisifyAll(new AWS.DynamoDB.DocumentClient({ region: 'eu-west-1' }));

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
    if (!response.hasOwnProperty('LastEvaluatedKey') && (!inQueryDomain(nextKey) || !hasMore(nextKey))) {
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
  getLogs,
};
