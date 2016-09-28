var InstanceContract = require('../contracts/InstanceContract.js'),
    TAG              = require('../helpers/TAG.js');

/**
 * Converts the Instance representation returned by AWS APIs in to an InstanceContract object
 */
function InstanceContractConverter() {
  
  var self = this;
  
  /**
   * Converts the EC2 instance representation returned by AWS APIs in to a light
   * InstanceContract object
   *
   * @param  {AWSInstance}      instance
   * @return {InstanceContract}
   * @public
   */
  self.convert = function (instance) {
    
    var id = instance.InstanceId;
    var state = instance.State.Name;
    var schedule = instance.Tags.filter(TAG.is("schedule")).map(TAG.value())[0];
    var environment = instance.Tags.filter(TAG.is("environment")).map(TAG.value())[0];
    var groupName = instance.Tags.filter(TAG.is("aws:autoscaling:groupname")).map(TAG.value())[0];
    
    var contract = new InstanceContract(id, state, groupName, environment, schedule);
    
    return contract;

  };

}

module.exports = InstanceContractConverter;