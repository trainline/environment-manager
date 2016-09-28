/**
 * Represents an anomaly happened putting AutoScalingGroup instances to 'InService'
 * @param   {String} groupName  : AutoScalingGroup name
 * @param   {Array} instanceIds : Missing instance Id
 * @param   {String} error      : Error message returned from AWS API
 * @returns {MovingInstancesInServiceAnomaly}
 */

function ExitingInstancesFromStandbyAnomaly(groupName, instanceIds, error) {
  
  this.GroupName = groupName;
  this.InstanceIds = instanceIds;
  this.Error = error;
  
  this.Type = "ExitingInstancesFromStandbyAnomaly";
  this.toString = function () {
    return "An error has occurred exiting " + instanceIds.join(', ') + " instances from Standby for '" + groupName + "' AutoScalingGroup: " + error;
  };

}

module.exports = ExitingInstancesFromStandbyAnomaly;