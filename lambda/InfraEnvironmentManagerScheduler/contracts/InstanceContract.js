/**
 * Represents an AWS EC2 instance
 * @param   {String} id          : Instance Id
 * @param   {String} state       : Instance state (stopped/running)
 * @param   {String} groupName   : AutoScalingGroup the instance belongs to
 * @param   {String} environment : Environment tag value
 * @param   {Object} schedule    : Schedule tag value and source
 * @returns {InstanceContract}
 */
function InstanceContract(id, state, groupName, environment, schedule) {
  
  this.Id = id;
  this.State = state;
  this.GroupName = groupName;
  this.Environment = environment;
  this.Schedule = schedule;

}

module.exports = InstanceContract;