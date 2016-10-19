'use strict'

const AWS = require('aws-sdk');

function createAWSService(config) {

  let ec2 = new AWS.EC2(config);

  function switchInstancesOn(instances) {
    return ec2.startInstances({ InstanceIds: instances, DryRun: true }).promise();
  }

  function switchInstancesOff(instances) {
    return ec2.stopInstances({ InstanceIds: instances, DryRun: true }).promise();
  }

  function putAsgInstancesInService(asgs) {
    return Promise.all(asgs.map(asg => {
      return ec2.exitStandby({
        AutoScalingGroupName: asg.AutoScalingGroupName,
        InstanceIds: asg.Instances ,
        DryRun: true
      }).promise();
    }));
  }

  function putAsgInstancesInStandby(asgs) {
    return Promise.all(asgs.map(asg => {
      return ec2.enterStandby({
        AutoScalingGroupName: asg.AutoScalingGroupName,
        InstanceIds: asg.Instances,
        ShouldDecrementDesiredCapacity: true,
        DryRun: true
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