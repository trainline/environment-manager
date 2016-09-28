/**
 * Represents an anomaly happened putting AutoScalingGroup instances to 'Standby'
 * @param   {String} groupName  : AutoScalingGroup name
 * @param   {Array} instanceIds : Missing instance Id
 * @param   {String} error      : Error message returned from AWS API
 * @returns {EnteringInstancesToStandbyAnomaly}
 */

function EnteringInstancesToStandbyAnomaly(groupName, instanceIds, error) {
  
  this.GroupName = groupName;
  this.InstanceIds = instanceIds;
  this.Error = error;
  
  this.Type = "EnteringInstancesToStandbyAnomaly";
  this.toString = function () {
    return "An error has occurred entering " + instanceIds.join(', ') + " instances in standby for '" + groupName + "' AutoScalingGroup: " + error;
  };

}

module.exports = EnteringInstancesToStandbyAnomaly;