/**
 * Represents an anomaly generated when an AutoScalingGroup instances state is not for all 'running' or 'stopped'
 * @param   {String} groupName : AutoScalingGroup name
 * @param   {Array} states     : Array of instance state values
 * @returns {MismatchingAutoScalingGroupStateAnomaly}
 */

function MismatchingAutoScalingGroupStateAnomaly(groupName, states) {
  
  this.GroupName = groupName;
  this.States = states;
  
  this.Type = "MismatchingAutoScalingGroupStateAnomaly";
  this.toString = function () {
    return "AutoScalingGroup '" + groupName + "' instances have an heterogeneous state: " + states.join(', ');
  };

}

module.exports = MismatchingAutoScalingGroupStateAnomaly;