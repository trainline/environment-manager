'use strict';

let _ = require('lodash');

function createClient(AWS, region, stage) {
  function getTable(tableName) {
    let documentClient = new AWS.DynamoDB.DocumentClient({ region });
    let stagedTableName = getAccountsTableName(stage, tableName);

    return {

      getAll: () => {
        let params = {
          TableName: stagedTableName,
          KeyConditionExpression: "customer = :customer",
          ExpressionAttributeValues: {
              ":customer": 'trainline'
          }
        };

        return documentClient.query(params).promise().then((data) => {
          return data.Items.map(fromDbItem);
        });
      },

      getItem: (key) => {
        let params = {
          TableName: stagedTableName,
          Key: {
            customer: 'trainline',
            accountNumber: key
          }
        };

        return documentClient.get(params).promise().then((data) => {
          return fromDbItem(data.Item);
        });
      },

      putItem: (key, item) => {
        let dbItem = Object.assign({}, item, {
          customer: 'trainline',
          accountNumber: key
        });

        let params = {
          TableName: stagedTableName,
          Item: dbItem
        };

        return documentClient.put(params).promise();
      }

    };
  }

  function getAccountsTableName(stage, tableName) {
    let prefix = stage !== undefined ? `${stage}-` : '';
    return prefix + tableName;
  }

  return { getTable };
}

function fromDbItem(item) {
  return _.pickBy(item, (value, key) => { return key !== 'customer'; });
}

module.exports = {
  createClient
};