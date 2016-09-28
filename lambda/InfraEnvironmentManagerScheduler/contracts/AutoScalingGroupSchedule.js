/**
 * Represents an AutoScalingGroup with its size and instances
 * @param   {String} name     : AutoScalingGroup name
 * @param   {Object} size     : AutoScalingGroup min/desired/max size
 * @param   {Array} instances : Array of InstanceSchedule
 * @returns {AutoScalingGroupSchedule}
 */
function AutoScalingGroupSchedule(name, size, instances) {
  
  this.Size = size;
  this.Name = name;
  this.Instances = instances;

}

module.exports = AutoScalingGroupSchedule;