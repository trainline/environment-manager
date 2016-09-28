var FIXED_SCHEDULE = {
  AlwaysOn: "247",
  AlwaysOff: "OFF"
};

var DEFAULT_SCHEDULE = FIXED_SCHEDULE.AlwaysOn;

var SCHEDULE_SOURCE = {
  Default: "Default",
  Environment: "Environment",
  AutoScalingGroup: "AutoScalingGroup",
  Instance: "Instance"
};

var SCHEDULE_ACTION = {
  Invalid: "INVALID",
  Default: "DEFAULT",
  Skip: "SKIP",
  On: "ON",
  Off: "OFF"
};

var MANAGED_INSTANCE_STATES = ['running', 'stopped'];
var MANAGED_INSTANCE_LIFECYCLES = ['InService', 'Standby'];

module.exports = {
  FIXED_SCHEDULE: FIXED_SCHEDULE,
  DEFAULT_SCHEDULE: DEFAULT_SCHEDULE,
  SCHEDULE_SOURCE: SCHEDULE_SOURCE,
  SCHEDULE_ACTION: SCHEDULE_ACTION,
  MANAGED_INSTANCE_STATES: MANAGED_INSTANCE_STATES,
  MANAGED_INSTANCE_LIFECYCLES: MANAGED_INSTANCE_LIFECYCLES
};