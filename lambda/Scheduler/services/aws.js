'use strict'

const AWS = require('aws-sdk');
const _ = require('lodash');

let ec2 = new AWS.EC2({ region: 'eu-west-1' });

function getAllInstances() {
  return ec2.describeInstances({})
    .promise()
    .then(result => {
      let groups = _.flatten(result.Reservations);
      return _.flatten(groups.map(group => group.Instances));
    });
}

function switchInstancesOn(instances) {
  return ec2.startInstances({ InstanceIds: instances, DryRun: true }).promise();
}

function switchInstancesOff(instances) {
  return ec2.stopInstances({ InstanceIds: instances, DryRun: true }).promise();
}

module.exports = {
  ec2: {
    getAllInstances,
    switchInstancesOn,
    switchInstancesOff
  }
}