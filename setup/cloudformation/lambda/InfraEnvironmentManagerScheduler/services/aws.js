'use strict'

const guid = require('uuid');
const co = require('co');

const RateLimiter = require('./rateLimiter');

function createAWSService(AWS, context, account) {
  return co(function*() {
    let awsConfig = { region: context.awsRegion };

    if (account && account.AccountNumber !== context.awsAccountId)
      awsConfig.credentials = yield getCredentials();

    let ec2 = new AWS.EC2(awsConfig);
    let autoscaling = new AWS.AutoScaling(awsConfig);

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
      return promiseAllWithSlowFail(promises);
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

    function decrypt(cyphertext) {
      let kms = new AWS.KMS();
      return new Promise((resolve, reject) => {
        kms.decrypt({ CiphertextBlob: new Buffer(cyphertext, 'base64') }, (err, data) => {
          if (err) reject(err);
          else resolve(data.Plaintext.toString('ascii'));
        });
      });
    }

    function getCredentials() {
      let roleArn = `arn:aws:iam::${account.AccountNumber}:role/${context.env.CHILD_ACCOUNT_ROLE_NAME}`;

      return assumeRole(roleArn).then(response =>
        new AWS.Credentials(
          response.Credentials.AccessKeyId,
          response.Credentials.SecretAccessKey,
          response.Credentials.SessionToken
        )
      );
    }

    function assumeRole(roleARN) {
      let sts = new AWS.STS();
      let params = {
        RoleArn: roleARN,
        RoleSessionName: guid.v1()
      };

      return sts.assumeRole(params).promise();
    }

    return {
      ec2: {
        switchInstancesOn,
        switchInstancesOff,
        putAsgInstancesInService,
        putAsgInstancesInStandby
      },
      kms: {
        decrypt
      }
    };
  });
}

module.exports = {
  create: createAWSService
};