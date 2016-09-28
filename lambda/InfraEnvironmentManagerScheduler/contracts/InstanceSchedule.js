/**
 * Represents an AWS Instance with its schedule value and state
 * @param   {String} id             : Instance Id
 * @param   {String} state          : Instance state (running/stopped)
 * @param   {String} lifecycle      : Instance lifecycle in AutoScalingGroup (Standby/InService)
 * @param   {String} scheduleValue  : Instance schedule value
 * @param   {String} scheduleSource : Instance schedule source (Instance/AutoScalingGroup/Environment/Default)
 * @returns {InstanceSchedule}
 */
function InstanceSchedule(id, state, lifecycle, scheduleValue, scheduleSource) {
  this.Id = id;
  this.State = state;
  this.Lifecycle = lifecycle;
  this.Schedule = {
    Value: scheduleValue,
    Source: scheduleSource
  };
}

module.exports = InstanceSchedule;