/**
 * Represents an anomaly generated when an AutoScalingGroup contains an instance that no longer exists in AWS
 * @param   {String} groupName   : AutoScalingGroup name
 * @param   {String} instanceId  : Missing instance Id
 * @returns {MissingInstanceAnomaly}
 */

function MissingInstanceAnomaly(groupName, instanceId) {
  
  this.GroupName = groupName;
  this.InstanceId = instanceId;
  
  this.Type = "MissingInstanceAnomaly";
  this.toString = function () {
    return "AutoScalingGroup '" + groupName + "' contains instance '" + instanceId + "' that does not exist.";
  };

}

module.exports = MissingInstanceAnomaly;
