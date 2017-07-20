'use strict';

var AwsAccount  = require('./AwsAccount'),
    DynamoTable = require('./DynamoTable');

var Convert = {
  objectToJsonString: function(object) {
    var result = JSON.stringify(object, null, '  ');
    return result;
  },
  jsonStringToObject: function(jsonString) {
    var result = JSON.parse(jsonString);
    return result;
  }
};

var Stringify = {
  defaultDynamoTableContent: function(content) {
    var result = content.map(Convert.objectToJsonString)
                        .join(',\n');

    return result;
  },
  lbUpstreamDynamoTableContent: function(content) {
    var normalizeValue = function(item) {
      item.Value = Convert.jsonStringToObject(item.value);
      delete item.value;

      return item;
    };

    var result = content.map(normalizeValue)
                        .map(Convert.objectToJsonString)
                        .join(',\n');

    return result;
  }
};

function createTable (accountName, accountNumber, tableName, bucketPath) {
  let account = new AwsAccount(accountName, accountNumber);

  let serializer = tableName === 'ConfigLBUpstream'
      ? Stringify.lbUpstreamDynamoTableContent
      : Stringify.defaultDynamoTableContent;

  return new DynamoTable(tableName, account, serializer, bucketPath);
};

module.exports = (masterAccount, childAccounts, bucketPath) => {
  let tables = masterAccount.tables.map(tableName =>
      createTable(masterAccount.name, masterAccount.number, tableName, bucketPath));

  childAccounts.forEach((childAccount) => {
    let childTables = childAccount.tables.map(tableName =>
        createTable(childAccount.name, childAccount.number, tableName, bucketPath));

    childTables.forEach(childTable => tables.push(childTable));
  });

  return tables;
};
