var assert = require('assert');

/**
 * This class decorate AutoScalingGroupsService class by returning AutoScalingGroup
 * which name matches provided regular expression
 *
 * @param {AutoScalingGroupsService} autoScalingGroupsService
 * @param {RegExp}                   namePattern
 */
function AutoScalingGroupsServiceDecorator(autoScalingGroupsService, namePattern) {

  assert(autoScalingGroupsService, "Missing 'autoScalingGroupsService' argument.");
  assert(namePattern, "Missing 'namePattern' argument.");

  var self = this;

  self.enterInstancesStandby = autoScalingGroupsService.enterInstancesStandby;
  
  self.exitInstancesStandby = autoScalingGroupsService.exitInstancesStandby;
  
  self.setMinimumSize = autoScalingGroupsService.setMinimumSize;
  
  self.getGroups = function(callback) {

    autoScalingGroupsService.getGroups(function(error, groups) {

      if (error) { callback(error); return; }

      var byMatchingName = function(group) { 
		return group.Name.match(namePattern); 
	  };

      callback(null, groups.filter(byMatchingName));

    });

  };

}

module.exports = AutoScalingGroupsServiceDecorator;