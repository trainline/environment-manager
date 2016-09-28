var AutoScalingGroupInstanceContract = require('../contracts/AutoScalingGroupInstanceContract.js'),
    AutoScalingGroupContract         = require('../contracts/AutoScalingGroupContract.js'),
    TAG                              = require('../helpers/TAG.js');

/**
 * Converts the AutoScalingGroup representation returned by AWS APIs in to an AutoScalingGroupContract object;
 */
function AutoScalingGroupContractConverter() {
  
  var self = this;
  
  /**
   * Converts an AutoScalingGroup representation returned by AWS APIs in to a
   * light AutoScalingGroupContract object
   *
   * @param  {AutoScalingGroup} autoScalingGroup
   * @return {AutoScalingGroupContract}
   * @public
   */
  self.convert = function (autoScalingGroup) {
    
    var name = autoScalingGroup.AutoScalingGroupName;
    var schedule = autoScalingGroup.Tags.filter(TAG.is("schedule")).map(TAG.value())[0];
    var instances = autoScalingGroup.Instances.map(function (instance) {
      return new AutoScalingGroupInstanceContract(instance.InstanceId, instance.LifecycleState);
    });
    
    var minSize = autoScalingGroup.MinSize;
    var desiredSize = autoScalingGroup.DesiredCapacity;
    var maxSize = autoScalingGroup.MaxSize;
    
    var contract = new AutoScalingGroupContract(name, instances, schedule, minSize, desiredSize, maxSize);
    
    return contract;

  };

}

module.exports = AutoScalingGroupContractConverter;