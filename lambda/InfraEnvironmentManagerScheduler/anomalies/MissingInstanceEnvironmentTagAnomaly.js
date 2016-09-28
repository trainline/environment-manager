/**
 * Represents an anomaly generated when an EC2 instance hasn't got any environment tag
 * @param   {String} instanceId : Instance id
 * @returns {MissingInstanceEnvironmentTagAnomaly}
 */

function MissingInstanceEnvironmentTagAnomaly(instanceId) {
  
  this.InstanceId = instanceId;
  
  this.Type = "MissingInstanceEnvironmentTagAnomaly";
  this.toString = function () {
    return "Instance '" + instanceId + "' has no Environment tag.";
  };

}

module.exports = MissingInstanceEnvironmentTagAnomaly;