var assert = require('assert');

/**
 * This class abstract AutoScaling resources access providing useful methods.
 *
 * @param {AutoScalingClientFactory} autoScalingClientFactory
 * @param {AutoScalingGroupContractConverter} autoScalingGroupContractConverter
 */
function AutoScalingGroupsService(autoScalingClientFactory, autoScalingGroupContractConverter) {
  
  assert(autoScalingClientFactory, "Missing 'autoScalingClientFactory' argument.");
  assert(autoScalingGroupContractConverter, "Missing 'autoScalingGroupContractConverter' argument.");
  
  var self = this;
  
  /**
   * Get asyncronously all AutoScalingGroup and returns the in the provided
   * callback.
   * @param {Function} callback;
   * @public
   */
  self.getGroups = function (callback) {
    
    var autoScalingClient = autoScalingClientFactory.create();
    var autoScalingGroups = [];
    
    function requestByToken(nextToken) {
      
      var request = {
        NextToken: nextToken
      };
      
      autoScalingClient.describeAutoScalingGroups(request, function (error, response) {
        
        // An error has occurred thus the flow ends
        if (error) { callback(error); return; }
        
        var autoScalingGroupContracts = response.AutoScalingGroups.map(autoScalingGroupContractConverter.convert);
        autoScalingGroups = autoScalingGroups.concat(autoScalingGroupContracts);
        
        // If 'NextToken' property exists means no all instances have been
        // returned thus a new request starting from the obtained token should
        // be performed.
        if (response.NextToken) requestByToken(response.NextToken);
        else callback(null, autoScalingGroups);

      });

    }
    
    requestByToken(undefined);

  };
  
  /**
   * Enter the specified AutoScalingGroup instances in Standby.
   * @param {String}   groupName
   * @param {Array}    instanceIds
   * @param {Function} callback
   * @public
   */
  self.enterInstancesStandby = function (groupName, instanceIds, callback) {
    
    var autoScalingClient = autoScalingClientFactory.create();
    
    var request = {
      AutoScalingGroupName: groupName,
      ShouldDecrementDesiredCapacity: true,
      InstanceIds: instanceIds
    };
    
    autoScalingClient.enterStandby(request, callback);

  };
  
  /**
   * Enter the specified AutoScalingGroup instances in Standby.
   * @param {String}   groupName
   * @param {Array}    instanceIds
   * @param {Function} callback
   * @public
   */
  self.exitInstancesStandby = function (groupName, instanceIds, callback) {
    
    var autoScalingClient = autoScalingClientFactory.create();
    
    var request = {
      AutoScalingGroupName: groupName,
      InstanceIds: instanceIds
    };
    
    autoScalingClient.exitStandby(request, callback);

  };
  
  self.setMinimumSize = function (groupName, size, callback) {
    
    var autoScalingClient = autoScalingClientFactory.create();
    
    var request = {
      AutoScalingGroupName: groupName,
      MinSize: size
    };
    
    autoScalingClient.updateAutoScalingGroup(request, callback);

  };

}

module.exports = AutoScalingGroupsService;