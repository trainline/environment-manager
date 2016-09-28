/**
 * Represents an anomaly generated when an AutoScalingGroup instances lifecycle is not for all 'InService' or 'Standby'
 * @param   {String} groupName : AutoScalingGroup name
 * @param   {Array} lifecycle  : Array of instance lifecycle values
 * @returns {MismatchingAutoScalingGroupLifecycleAnomaly}
 */

function MismatchingAutoScalingGroupLifecycleAnomaly(groupName, lifecycle) {
  
  this.GroupName = groupName;
  this.Lifecycle = lifecycle;
  
  this.Type = "MismatchingAutoScalingGroupLifecycleAnomaly";
  this.toString = function () {
    return "AutoScalingGroup '" + groupName + "' instances have an heterogeneous lifecycle: " + lifecycle.join(', ');
  };

}

module.exports = MismatchingAutoScalingGroupLifecycleAnomaly;