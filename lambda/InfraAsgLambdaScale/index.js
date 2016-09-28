/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

/**
 * Node javascript lambda which updates dynamodb list of servers in AWS based on ASG contents and state and event messages
 * 
 * Modify these variables for your use case. This script needs to be run on master account and
 * each of child accounts.
 */

// Master account number
let MASTER_ACCOUNT = // Assign the AWS account ID (string) of your master account.

// IAM role that this script is running on, it has be the same on master and child accounts
let SCRIPT_IAM_ROLE = 'roleInfraAsgScale';

// This is ARN for the role to be assumed by child account script to modify master DynamoDb
const MASTER_ACCOUNT_ROLE_ARN = `arn:aws:iam::${MASTER_ACCOUNT}:role/${SCRIPT_IAM_ROLE}`;

console.log('Loading function');

//Import libraries

let async = require('async');
let Set = require('es6-set'); // only needed until node > 0.12
let AWSsdk = require('aws-sdk'); //provided by lambda
let EC2sdk = new AWSsdk.EC2();
let ASGsdk = new AWSsdk.AutoScaling();
let sns = new AWSsdk.SNS(); // For sending output
let ddb = new AWSsdk.DynamoDB({ TableName: 'InfraAsgIPs' });

//Debug variables
let DEBUGMODE = true;
let invoke_count = 1;

function awsAccount(context) {
    let match = /^arn:aws:lambda:[^:]*:([^:]+):function:/.exec(context.invokedFunctionArn);
    if (match !== null && match.length > 1) {
        return match[1];
    }
    throw new Error('Could not determine AWS account from context object.');
}

exports.handler = function (event, context) {

  let isChildAccount = awsAccount(context) !== MASTER_ACCOUNT;

  console.log('\n\nLoading handler:');
  invoke_count += 1;

  var Inadd = new Set(); // For New Instances reported by the event
  var Indrop = new Set(); // For Removed Instances addresses reported by the event
  var ASGs = new Set(); // Set of ASGs in the event
  var DEBUG = []; // Array of debug messages
  var test = false;
  // Wrapper, simplifies mailing results of console log messages.
  function debug(message) {
    DEBUG.push([Date(), message]);
    console.log(message);
  };

  //
  //classify each message into an 'add','drop' and 'asg' set.
  //
  if (event) {
    if (event.hasOwnProperty('detail')) { //it's a cloudwatch API event
      ASGs.add(event.detail.requestParameters.autoScalingGroupName);
      console.log('Scaling message:' + event.detail.requestParameters);
      test = true; //new message type, doesn't add or drop instances

    } else {
      for (var i = 0; i < event.Records.length; i++) {
        record = event.Records[i];
        message = JSON.parse(record.Sns.Message);
        id = message.EC2InstanceId;
        asg = message.AutoScalingGroupName;
        if (message.LifecycleTransition) { message.Event = message.LifecycleTransition; };

        switch (message.Event) {

          case 'autoscaling:EC2_INSTANCE_LAUNCH':
            Inadd.add(id);
            break;
          case 'autoscaling:EC2_INSTANCE_TERMINATE':
            Indrop.add(id);
            break;
          case 'autoscaling:EC2_INSTANCE_LAUNCHING':
            Inadd.add(id);
            break;
          case 'autoscaling:EC2_INSTANCE_TERMINATING':
            Indrop.add(id);
            break;
          case 'autoscaling:EC2_INSTANCE_LAUNCH_ERROR':
            Indrop.add(id);
            break;
          case 'autoscaling:TEST_NOTIFICATION':
            test = true;
            break; // used to initially populate
          default:
            debug('FAIL: Unexpected Message: ' + JSON.stringify(message));
            return context.fail();
        }
        ASGs.add(asg);
      }
    }
  }
  //
  //check we have updates, and they are for exactly 1 ASG.
  //

  if (ASGs.size < 1) { context.fail('NOOP FAIL: no ASGs found to change'); };

  if (ASGs.size > 1) { context.fail('DESIGN FAIL: more than one ASG per event!'); };

  if ((!test) && (Inadd.size < 1) && (Indrop.size < 1)) { context.fail('NOOP FAIL: No instances to change'); };

  var ASG = setToArray(ASGs).pop(); // now safe because we've confirmed just one.

  //summarise actions for the log
  debug('add actions (' + Inadd.size + '): ' + setToArray(Inadd));
  debug('drop actions (' + Indrop.size + '): ' + setToArray(Indrop));

  //
  //  ***   ***   ***   ASYNC begins:  ***  ***   ***
  // Each 'task' in the waterfall is a function that takes a callback from the waterfall.
  // if the previous task finished with extra data, it is prepended to the parameter list for the next task.
  // in most cases a task looks like:
  //
  // function taskname(data, callback)
  // { result = dostuff(data);
  //    return callback(null, result)
  // };
  //
  // tasks are not called if the previous one failed, it skips straight to the error handling at the end.
  // if doing risky stuff, raise an error with
  // return callback(new error('message'))
  //
  //

  async.waterfall([
    getASGDetail,
    processASGMembers,
    getInstanceData,
    filterIPfromInstanceData,
    writeSNS,
    updateDDB,
    updateRemoteDDB,
  ], function (err, result) {
    if (err) { context.fail(err, null); } else { context.done(null, result); }
  });

  // Waterfall functions below.

  function getASGDetail(callback) {
    //uses ASGs from the context before waterfall was run
    //Retrieve ALL instances from the ASG that has changed
    debug('get ASG Details: ', setToArray(ASGs));
    var parameters = { AutoScalingGroupNames: setToArray(ASGs) };
    ASGsdk.describeAutoScalingGroups(parameters, callback);
  }

  function processASGMembers(data, callback) {
    //data is array of instances from ASG function
    var Instances = [];
    var InstanceGroup = data.AutoScalingGroups.pop(); // we have requested just one ASG, so safe to take the first result.
    while (InstanceGroup.Instances.length > 0) {
      instance = InstanceGroup.Instances.pop();
      debug({ 'instance found': instance });
      if (instance.LifecycleState == 'InService') {
        Instances.push(instance.InstanceId);
      }
    }

    return callback(null, Instances);
  }

  function getInstanceData(instances, callback) {
    //data is array of instanceIDs
    if (instances.length > 0) { // only request actual instances IDs.
      var parameters = { InstanceIds: instances };
      EC2sdk.describeInstances(parameters, callback);
    } else {
      debug({ 'skipped ec2 call because': instances });
      return callback(null, instances);
    };
  }

  function filterIPfromInstanceData(data, callback) {
    //data is ec2.describeinstances result.
    //ASG comes from parent context
    //TODO: ignore static IP network interfaces by filtering on tags.
    debug('filtering IP from Instance Data');
    var IPs = [];
    if (data.Reservations) // check we have something to do
    {
      while (data.Reservations.length > 0) {
        reservation = data.Reservations.pop();
        while (reservation.Instances.length > 0) {
          instance = reservation.Instances.pop();
          while (instance.NetworkInterfaces.length > 0) {
            nic = instance.NetworkInterfaces.pop();
            IPs.push(nic.PrivateIpAddress);
            debug({ ASG: ASG, IP: nic.PrivateIpAddress });
          }
        }
      }
    }

    return callback(null, { ASG: ASG, IPs: IPs });
  }

  function writeSNS(data, callback) {
    // passthrough function that sends a string message on SNS
    debug('writeSNS');
    message = { Sent: data, date: Date(), invoke_count: invoke_count, Debuginfo: DEBUG };
    sns.publish({
      Message: 'AUTOSCALING CHANGE: ' + JSON.stringify(message, null, 4),
      TopicArn: 'arn:aws:sns:eu-west-1:886983751479:InfraGovernator',
    }, function (err, SNSdata) {
      return callback(null, data); }); // TODO: needs error handling!
  }

  function updateDDB(data, callback) {
    debug({ writeddb: data });
    if (data.ASG) {
      var IPstring = JSON.stringify(data.IPs); // turn into string for dynamodb
      var request = {
        Key: {
          AsgName: {
            S: data.ASG,
          },
        },
        TableName: 'InfraAsgIPs',
        AttributeUpdates: {
          IPs: {
            Action: 'PUT',
            Value: {
              S: IPstring,
            },
          },
        },

      };


      //ddb.updateItem({TableName: "InfraAsgIPs", Item: {AsgName: {S: data.ASG}, IPs: {S: IPstring}}},
      ddb.updateItem(request,
        function (err, ddbdata) {
          if (err) {
            debug('Update item request failed: ' + JSON.stringify(request));
            debug('Error: ' + JSON.stringify(err));
            callback(err, 'Failed');
          } else {
            debug('Success: Updated:' + JSON.stringify(data));
            debug('ddbresponse' + JSON.stringify(ddbdata));
            callback(null, request);
          }
        });
    } else {
      return callback(new error('No ASG specified, cannot write!'));
    }
  }

  function updateRemoteDDB(request, callback) {
    if (isChildAccount === true) {
      // If this script is running on child account, we have to update master account DynamoDB data

      sts = new AWSsdk.STS();

      var params = {
        RoleArn: MASTER_ACCOUNT_ROLE_ARN,
        RoleSessionName: 'ExternalTestInfraAsgLambda',
      };

      sts.assumeRole(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
          var options = {
            credentials: sts.credentialsFrom(data),
          };

          var db2 = new AWSsdk.DynamoDB(options);

          db2.updateItem(request,
            function (err, ddbdata) {
              if (err) {
                debug('ExternalUpdate item request failed: ' + JSON.stringify(request));
                debug('Error: ' + JSON.stringify(err));
                callback(err, 'Failed');
              } else {
                debug('Success: External Updated:' + JSON.stringify(data));
                debug('ddbresponse' + JSON.stringify(ddbdata));
                callback(null, 'Success, local and remote');
              }
            }
          );
        }
      });
    } else callback(null, 'Successfully updated local account');
    //return callback(null, "Success: Updated:"+JSON.stringify(data));
  }
};

function setToArray(set) {
  var it = set.values(),
    ar = [],
    val;

  while (val = it.next().value) {
    ar.push(val);
  }

  return ar;
}
