/**
 * Represents an AWS EC2 instance inside its AutoScalingGroup
 * @param   {String} id        : Instance Id
 * @param   {String} lifecycle : Instance lifecycle into the AutoScalingGroup (InService/Standby)
 * @returns {AutoScalingGroupInstanceContract}
 */
function AutoScalingGroupInstanceContract(id, lifecycle) {
  
  this.Id = id;
  this.Lifecycle = lifecycle;

}

module.exports = AutoScalingGroupInstanceContract;