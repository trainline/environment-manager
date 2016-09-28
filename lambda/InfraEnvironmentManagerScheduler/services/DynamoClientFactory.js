var assert = require('assert'),
    AWS    = require("aws-sdk");

/**
 * Allows to create DynamoDB Document client instances based on a specific aws region.
 */
function DynamoClientFactory(region) {
  assert(region, "Missing 'region' argument.");
  assert(region.length, "Argument 'region' cannot be null or empty.");
  
  var self = this;
  
  /**
   * Create a new instance of DynamoDB Document client
   * @return {DynamoDB.DocumentClient}
   * @public
   */
  self.create = function () {
    var parameters = { region: region };
    return new AWS.DynamoDB.DocumentClient(parameters);
  };
}

module.exports = DynamoClientFactory;