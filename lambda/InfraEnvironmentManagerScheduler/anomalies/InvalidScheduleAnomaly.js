/**
 * Represents an schedule tag which contains an invalid and unprocessable value
 * @param   {String} instanceId      : EC2 instance id
 * @param   {String} schedule        : Invalid schedule value
 * @returns {InvalidScheduleAnomaly}
 */

function InvalidScheduleAnomaly(instanceId, schedule) {
  
  this.InstanceId = instanceId;
  this.Schedule = schedule;
  
  this.Type = "InvalidScheduleAnomaly";
  this.toString = function () {
    return "Instance '" + instanceId + "' has an invalid schedule value: '" + schedule + "'.";
  };

}

module.exports = InvalidScheduleAnomaly;