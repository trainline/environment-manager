var assert = require('assert'),
    AWS    = require("aws-sdk");

/**
 * Creates an AutoScaling client to work with AWS AutoSclingGroups in to the
 * specified region.
 *
 * @param {String} region
 */
function AutoScalingClientFactory(region) {
  assert(region, "Missing 'region' argument.");
  assert(region.length, "Argument 'region' cannot be null or empty.");
  
  var self = this;
  
  /**
   * Create a new instance of AutoScaling client
   * @return {AutoScaling}
   * @public
   */
  self.create = function () {
    var parameters = { region: region };
    return new AWS.AutoScaling(parameters);
  };
}

module.exports = AutoScalingClientFactory;