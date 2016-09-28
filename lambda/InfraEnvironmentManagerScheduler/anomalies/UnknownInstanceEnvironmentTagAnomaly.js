/**
 * Represents an anomaly generated when an EC2 instance refers to an unknown environment
 * @param   {String} instanceId      : Instance id
 * @param   {String} environmentName : Instance environment tag value
 * @returns {UnknownInstanceEnvironmentTagAnomaly}
 */

function UnknownInstanceEnvironmentTagAnomaly(instanceId, environmentName) {
  
  this.InstanceId = instanceId;
  this.EnvironmentName = environmentName;
  
  this.Type = "UnknownInstanceEnvironmentTagAnomaly";
  this.toString = function () {
    return "Instance '" + instanceId + "' has an unknown Environment tag '" + environmentName + "'.";
  };

}

module.exports = UnknownInstanceEnvironmentTagAnomaly;