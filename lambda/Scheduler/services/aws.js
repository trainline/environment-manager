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

  return {
    ec2: {
      switchInstancesOn,
      switchInstancesOff
    }
  };

}

module.exports = {
  create: createAWSService
};