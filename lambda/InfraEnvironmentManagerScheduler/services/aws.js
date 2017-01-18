'use strict'

const AWS = require('aws-sdk');
const RateLimiter = require('./rateLimiter');

function createAWSService(config) {

  let ec2 = new AWS.EC2(config);
  let autoscaling = new AWS.AutoScaling(config);

  let autoscalingRateLimiter = new RateLimiter(10);

  function switchInstancesOn(instances) {
    return promiseAllWithSlowFail(instances.map(instance => {
      return ec2.startInstances({
        InstanceIds: [instance.id]
      }).promise();
    }));
  }

  function switchInstancesOff(instances) {
    return promiseAllWithSlowFail(instances.map(instance => {
      return ec2.stopInstances({
        InstanceIds: [instance.id]
      }).promise();
    }));
  }

  function putAsgInstancesInService(instances) {
    let tasks = instances.map(instance => {
      return () => {
        return autoscaling.exitStandby({
          AutoScalingGroupName: instance.asg,
          InstanceIds: [instance.id]
        }).promise();
      };
    });

    let promises = tasks.map(autoscalingRateLimiter.queueTask);
    return promiseAllWithSlowFail(tasks);
  }

  function putAsgInstancesInStandby(instances) {
    let tasks = instances.map(instance => {
      return () => {
        return autoscaling.enterStandby({
          AutoScalingGroupName: instance.asg,
          InstanceIds: [instance.id],
          ShouldDecrementDesiredCapacity: true
        }).promise();
      };
    });

    let promises = tasks.map(autoscalingRateLimiter.queueTask);
    return promiseAllWithSlowFail(promises);
  }

  function promiseAllWithSlowFail(promises) {
    let errors = [];

    let safePromises = promises.map(promise => {
      return promise.catch(err => {
        errors.push(err);
      });
    });

    return Promise.all(safePromises).then(results => {
      if (errors.length > 0)
        throw { message: `${errors.length} operations failed.`, errors: errors };

      return results;
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