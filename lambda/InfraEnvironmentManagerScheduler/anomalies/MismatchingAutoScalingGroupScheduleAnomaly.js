/**
 * Represents an anomaly generated when an AutoScalingGroup contains instances with different schedules
 * @param   {String} groupName : AutoScalingGroup name
 * @param   {Array} schedules  : Array of schedule values
 * @returns {MismatchingAutoScalingGroupScheduleAnomaly}
 */

function MismatchingAutoScalingGroupScheduleAnomaly(groupName, schedules) {
  
  this.GroupName = groupName;
  this.Schedules = schedules;
  
  this.Type = "MismatchingAutoScalingGroupScheduleAnomaly";
  this.toString = function () {
    return "AutoScalingGroup '" + groupName + "' contains instances with mismatching schedule tags: " + schedules.join(', ');
  };

}

module.exports = MismatchingAutoScalingGroupScheduleAnomaly;