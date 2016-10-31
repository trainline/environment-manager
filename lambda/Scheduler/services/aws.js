'use strict'

const AWS = require('aws-sdk');

function createAWSService(config) {

  let ec2 = new AWS.EC2(config);
  let autoscaling = new AWS.AutoScaling(config);

  function switchInstancesOn(instances) {
    return ec2.startInstances({ InstanceIds: instances.map(i => i.id) }).promise();
  }

  function switchInstancesOff(instances) {
    return ec2.stopInstances({ InstanceIds: instances.map(i => i.id) }).promise();
  }

  function putAsgInstancesInService(instances) {
    return Promise.all(instances.map(instance => {
      return autoscaling.exitStandby({
        AutoScalingGroupName: instance.asg,
        InstanceIds: [instance.id]
      }).promise();
    }));
  }

  function putAsgInstancesInStandby(instances) {
    return Promise.all(instances.map(instance => {
      return autoscaling.enterStandby({
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