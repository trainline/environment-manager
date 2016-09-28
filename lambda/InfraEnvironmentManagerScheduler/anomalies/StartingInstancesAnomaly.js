/**
 * Represents an anomaly happened starting instances
 * @param   {String} groupName  : AutoScalingGroup name
 * @param   {Array} instanceIds : Missing instance Id
 * @param   {String} error      : Error message returned from AWS API
 * @returns {StartingInstancesAnomaly}
 */

function StartingInstancesAnomaly(groupName, instanceIds, error) {
  
  this.GroupName = groupName;
  this.InstanceIds = instanceIds;
  this.Error = error;
  
  this.Type = "StartingInstancesAnomaly";
  this.toString = function () {
    return "An error has occurred starting " + instanceIds.join(', ') + " instances for '" + groupName + "' AutoScalingGroup: " + error;
  };

}

module.exports = StartingInstancesAnomaly;