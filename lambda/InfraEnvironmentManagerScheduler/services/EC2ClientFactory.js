var assert = require('assert'),
    AWS    = require("aws-sdk");

/**
 * Allows to create a EC2 client instances based on a specific aws
 * region.
 *
 * @param {String} region
 */
function EC2ClientFactory(region) {
  assert(region, "Missing 'region' argument.");
  assert(region.length, "Argument 'region' cannot be null or empty.");
  
  var self = this;
  
  /**
   * Create a new instance of EC2 client
   * @return {EC2}
   * @public
   */
  self.create = function () {
    var parameters = { region: region };
    return new AWS.EC2(parameters);
  };
}

module.exports = EC2ClientFactory;