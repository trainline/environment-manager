/**
 * Represents an AWS AutoScalingGroup
 * @param   {String}  name        : AutoScalingGroup name
 * @param   {Array}   instances   : Array of AutoScalingGroupInstanceContract
 * @param   {Object}  schedule    : AutoScalingGroup schedule tag
 * @param   {Integer} minSize     : AutoScalingGroup minimum size
 * @param   {Integer} desiredSize : AutoScalingGroup desired size
 * @param   {Integer} maxSize     : AutoScalingGroup maximum size
 * @returns {AutoScalingGroupContract}
 */
function AutoScalingGroupContract(name, instances, schedule, minSize, desiredSize, maxSize) {
  
  this.Name = name;
  this.Instances = instances;
  this.Schedule = schedule;
  
  this.Size = {
    Min: minSize,
    Desired: desiredSize,
    Max: maxSize
  };

}

module.exports = AutoScalingGroupContract;