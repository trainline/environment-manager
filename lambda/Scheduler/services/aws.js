'use strict'

const AWS = require('aws-sdk');

function createAWSService(config) {

  let ec2 = new AWS.EC2(config);

  function switchInstancesOn(instances) {
    return ec2.startInstances({ InstanceIds: instances }).promise();
  }

  function switchInstancesOff(instances) {
    return ec2.stopInstances({ InstanceIds: instances }).promise();
  }

  function putAsgInstancesInService(instances) {
    return Promise.all(instances.map(instance => {
      return ec2.exitStandby({
        AutoScalingGroupName: instance.asg,
        InstanceIds: [instance.id]
      }).promise();
    }));
  }

  function putAsgInstancesInStandby(instances) {
    return Promise.all(instances.map(instance => {
      return ec2.enterStandby({
        AutoScalingGroupName: instance.asg,
        InstanceIds: [instance.id],
        ShouldDecrementDesiredCapacity: true
      }).promise();
    }));
  }

  return {
    ec2: {
      switchInstancesOn,
      switchInstancesOff,
      putAsgInstancesInService,
      putAsgInstancesInStandby
    }
  };

}

module.exports = {
  create: createAWSService
};