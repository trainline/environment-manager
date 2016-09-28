var assert = require('assert');

/**
 * This class abstract EC2 resources access providing useful methods.
 *
 * @param {EC2ClientFactory} ec2ClientFactory
 * @param {InstanceContractConverter} instanceContractConverter
 */
function EC2InstancesService(ec2ClientFactory, instanceContractConverter) {
  
  assert(ec2ClientFactory, "Missing 'ec2ClientFactory' argument.");
  assert(instanceContractConverter, "Missing 'instanceContractConverter' argument.");
  
  var self = this;
  
  /**
   * Get asyncronously all instances in the current AWS account and returns
   * them in the provided callback.
   * @param {Function} callback;
   * @public
   */
  self.getInstances = function (callback) {
    
    var instances = [];
    var ec2Client = ec2ClientFactory.create();
    
    function flatInstances(reservations) {
      
      var instances = [];
      
      // Any reservation contains a list of instances.
      // This double loop flats the original response to a list of instances.
      reservations.forEach(function (reservation) {
        reservation.Instances.forEach(function (instance) {
          
          var instanceContract = instanceContractConverter.convert(instance);
          instances.push(instanceContract);

        });
      });
      
      return instances;

    }
    
    function requestByToken(nextToken) {
      
      var request = {
        NextToken: nextToken
      };
      
      ec2Client.describeInstances(request, function (error, response) {
        
        // An error has occurred thus the flow ends
        if (error) { callback(error); return; }
        
        instances = instances.concat(flatInstances(response.Reservations));
        
        // If 'NextToken' property exists means no all instances have been
        // returned thus a new request starting from the obtained token should
        // be performed.
        if (response.NextToken) requestByToken(response.NextToken);
        else callback(null, instances);

      });

    }
    
    requestByToken(undefined);

  };
  
  self.stopInstances = function (instanceIds, callback) {
    
    var ec2Client = ec2ClientFactory.create();
    
    var request = {
      InstanceIds: instanceIds
    };
    
    ec2Client.stopInstances(request, callback);

  };
  
  self.startInstances = function (instanceIds, callback) {
    
    var ec2Client = ec2ClientFactory.create();
    
    var request = {
      InstanceIds: instanceIds
    };
    
    ec2Client.startInstances(request, callback);

  };

}

module.exports = EC2InstancesService;