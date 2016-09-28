/**
 * Represents an anomaly happened stopping instances
 * @param   {String} groupName  : AutoScalingGroup name
 * @param   {Array} instanceIds : Missing instance Id
 * @param   {String} error      : Error message returned from AWS API
 * @returns {StoppingInstancesAnomaly}
 */

function StoppingInstancesAnomaly(groupName, instanceIds, error) {
  
  this.GroupName = groupName;
  this.InstanceIds = instanceIds;
  this.Error = error;
  
  this.Type = "StoppingInstancesAnomaly";
  this.toString = function () {
    return "An error has occurred stopping " + instanceIds.join(', ') + " instances for '" + groupName + "' AutoScalingGroup: " + error;
  };

}

module.exports = StoppingInstancesAnomaly;