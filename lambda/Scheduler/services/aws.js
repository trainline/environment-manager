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
    return promiseAllWithSlowFail(instances.map(instance => {
      return () => {
        return autoscaling.exitStandby({
          AutoScalingGroupName: instance.asg,
          InstanceIds: [instance.id]
        }).promise();
      };
    }));
  }

  function putAsgInstancesInStandby(instances) {
    return promiseAllWithSlowFail(instances.map(instance => {
      return () => {
        return autoscaling.enterStandby({
          AutoScalingGroupName: instance.asg,
          InstanceIds: [instance.id],
          ShouldDecrementDesiredCapacity: true
        }).promise();
      };
    }));
  }

  function promiseAllWithSlowFail(tasks) {
    let errors = [];

    let promises = tasks.map(task => {
      return task().catch(err => { errors.push(err); });
    });

    return Promise.all(promises).then(() => {
      if (errors.length > 0)
        throw { message: `${errors.length} operations failed.`, errors: errors };
    });
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