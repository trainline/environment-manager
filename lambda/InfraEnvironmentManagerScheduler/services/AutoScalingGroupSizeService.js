var assert = require('assert');

/**
 * This service allows to store or get the previously stored AutoScalingGroup
 * size. It does not affect the real AutoScalingGroup in AWS.
 *
 * @param {DynamoTableProvider} dynamoTableProvider
 */
function AutoScalingGroupSizeService(dynamoTableProvider) {
  
  assert(dynamoTableProvider, "Missing 'dynamoTableProvider' argument.");
  
  var self = this;
  var tableName = "InfraAsgIPs";
  var propertyName = "Size";
  
  function createKeyByValue(value) {
    return {
      AsgName: value
    };
  }
  
  /**
   * Get the previously stored AutoScalingGroup size by its name.
   *
   * @param {String}   groupName
   * @param {Function} callback
   */
  self.load = function (groupName, callback) {
    
    var key = createKeyByValue(groupName);
    dynamoTableProvider.getPropertyByKey(tableName, key, propertyName, callback);

  };
  
  /**
   * Store the provided AutoScalingGroup size with its name.
   *
   * @param {String}   groupName
   * @param {Object}   groupSize
   * @param {Function} callback
   */
  self.store = function (groupName, groupSize, callback) {
    
    var key = createKeyByValue(groupName);
    dynamoTableProvider.setPropertyByKey(tableName, key, propertyName, groupSize, callback);

  };

}

module.exports = AutoScalingGroupSizeService;