var assert = require('assert');

/**
 * This class abstract DynamoDB access providing useful methods.
 *
 * @param {DynamoClientFactory} dynamoClientFactory
 */
function DynamoTableProvider(dynamoClientFactory) {
  
  assert(dynamoClientFactory, "Missing 'dynamoClientFactory' argument.");
  
  var self = this;
  
  /**
   * Given a DynamoDB table name scans asyncronously the whole content and
   * returns all item in the provided callback.
   *
   * @param {String} tableName
   * @param {Function} callback
   * @public
   */
  self.scanTable = function (tableName, callback) {
    
    assert(tableName, "Missing 'tableName' argument.");
    assert(tableName.length, "Argument 'tableName' cannot be empty.");
    
    var dynamoClient = dynamoClientFactory.create();
    var items = [];

    var requestByStartKey = function(startKey) {

      var request = {
        TableName: tableName,
        ExclusiveStartKey: startKey
      };

      dynamoClient.scan(request, function(error, response) {

        // An error has occurred thus the flow ends
        if (error) {
          callback(error);
          return;
        }

        // Append retrieved items to the result
        items = items.concat(response.Items);

        // If 'LastEvaluatedKey' exists then [scan] operation did not read the
        // whole table content thus a new [scan] is need starting from the last
        // evaluated key.
        var lastKey = response.LastEvaluatedKey;

        if (lastKey) requestByStartKey(lastKey);
        else callback(null, items);

      });
    };
    
    requestByStartKey(undefined);
  };
  
  self.getPropertyByKey = function (tableName, key, propertyName, callback) {
    
    var dynamoClient = dynamoClientFactory.create();
    
    var request = {
      TableName : tableName,
      Key: key
    };
    
    dynamoClient.get(request, function (error, data) {
      if (error) callback(error);
      else callback(null, data.Item[propertyName]);
    });

  };
  
  self.setPropertyByKey = function (tableName, key, propertyName, propertyValue, callback) {
    
    var dynamoClient = dynamoClientFactory.create();
    
    var request = {
      TableName : tableName,
      Key: key,
      UpdateExpression: "set #p = :p",
      ExpressionAttributeNames: { '#p': propertyName },
      ExpressionAttributeValues: { ':p': propertyValue }
    };
    
    dynamoClient.update(request, callback);

  };
}

module.exports = DynamoTableProvider;