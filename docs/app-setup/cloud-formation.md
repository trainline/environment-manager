---
title: CloudFormation
layout: docs
weight: 10
---

Customise and upload the Lambda Functions, then customise the CloudFormation templates and create the stacks.

### Lambda Functions

This project contains code for the following Lambda Functions

<table>
    <tr><th>Lambda Function</th><th>Description</th></tr>
    <tr><td>InfraAsgScale</td><td>Updates DynamoDB with current ASG instances information whenever ASG scales in or scales out</td></tr>
    <tr><td>InfraDynamoStreamReplica</td><td>Replicates data from each of the DynamoDB tables in your master account to the corresponding table in each of your child accounts</td></tr>
    <tr><td>InfraEnvironmentManagerAudit</td><td>Writes audit events that occur in your child accounts to a DynamoDB table in your master account</td></tr>
    <tr><td>InfraEnvironmentManagerScheduler</td><td>Schedules Auto Scaling Groups</td></tr>
</table>

The Lambda Functions included in this project must be customized to your target environment, packaged as .zip files and uploaded to an S3 location readable by the account in which they will be created. 

1. Configure the InfraAsgScale Lambda function to use your master account. Edit [InfraAsgLambdaScale/index.js][InfraAsgLambdaScale/index.js]; assign the AWS account ID of your master account to `MASTER_ACCOUNT`.
1. Configure the InfraDynamoStreamReplica Lambda function to replicate data from the DynamoDB tables in your master account to each of your child accounts. Edit [InfraDynamoStreamReplica/index.js][InfraDynamoStreamReplica/index.js]; assign an array of the AWS account ID of each of your child accounts to `DESTINATION_ACCOUNTS`.
1. Configure the InfraEnvironmentManagerAudit Lambda function to write audit events to your master account. Edit [InfraEnvironmentManagerAudit/index.js][InfraEnvironmentManagerAudit/index.js]; assign the AWS account ID of your master account to `DESTINATION_ACCOUNT_ID`.
1. Run `npm install` in the root directory of each Lambda function and archive the contents (excluding `package.json`) to a zip file by the same name as the root directory.

### CloudFormation

We have supplied CloudFormation templates to create most of the resources Environment Manager depends on.

### Master Account

The following steps will create the resources necessary to run the Environment Manager application in your master account, including an auto scaling group containing two EC2 instances behind an elastic load balancer, ready for you to install Environment Manager.

1. Upload `InfraDynamoStreamReplica.zip` to the `/EnvironmentManager` folder in the S3 bucket that contains your Lambda function code for your master account.
1. Configure cross-account access between your master and child accounts
    1. Edit [EnvironmentManagerCommonResources.template][EnvironmentManagerCommonResources.template]; allow each child account to assume `roleInfraEnvironmentManagerAuditWriter` (see comments in file)
    1. Edit [EnvironmentManagerCommonResources.template][EnvironmentManagerCommonResources.template]; allow `roleInfraDynamoStreamReplica` to assume `roleInfraDynamoStreamReplicaWriter` in each child account (see comments in file)
    1. Edit [EnvironmentManagerMasterResources.template][EnvironmentManagerMasterResources.template]; allow `roleInfraEnvironmentManager` to assume `roleInfraEnvironmentManagerChild` in each child account (see comments in file)
1. Create a new CloudFormation stack using [EnvironmentManagerCommonResources.template][EnvironmentManagerCommonResources.template]
1. Once the previous stack has been created, create a new CloudFormation stack using [EnvironmentManagerMasterResources.template][EnvironmentManagerMasterResources.template]
1. If the master account is also a child account i.e. it will deploy services to itself, follow the instructions below.

### Child Account

The following steps will create the resources necessary for the Environment Manager running in your master account to administer and monitor auto scaling groups and services in this child account.

1. Upload `InfraEnvironmentManagerAudit.zip` and `InfraEnvironmentManagerScheduler.zip` to the `/EnvironmentManager` folder in the S3 bucket that contains your Lambda function code for your child account.
1. Create a new CloudFormation stack using [EnvironmentManagerCommonResources.template][EnvironmentManagerCommonResources.template]
1. Once the previous stack has been created, create a new CloudFormation stack using  [EnvironmentManagerChildResources.template][EnvironmentManagerChildResources.template]

[child]: https://github.com/trainline/environment-manager/blob/master/setup/cloudformation/EnvironmentManagerChildResources.template
[common]: https://github.com/trainline/environment-manager/blob/master/setup/cloudformation/EnvironmentManagerChildResources.template
[master]: https://github.com/trainline/environment-manager/blob/master/setup/cloudformation/EnvironmentManagerChildResources.template
[InfraAsgLambdaScale/index.js]: https://github.com/trainline/environment-manager/blob/master/lambda/InfraAsgLambdaScale/index.js
[InfraDynamoStreamReplica/index.js]: https://github.com/trainline/environment-manager/blob/master/lambda/InfraDynamoStreamReplica/index.js
[InfraEnvironmentManagerAudit/index.js]: https://github.com/trainline/environment-manager/blob/master/lambda/InfraEnvironmentManagerAudit/index.js
[EnvironmentManagerCommonResources.template]: https://github.com/trainline/environment-manager/blob/master/setup/cloudformation/EnvironmentManagerCommonResources.template
[EnvironmentManagerMasterResources.template]: https://github.com/trainline/environment-manager/blob/master/setup/cloudformation/EnvironmentManagerMasterResources.template
[EnvironmentManagerChildResources.template]: https://github.com/trainline/environment-manager/blob/master/setup/cloudformation/EnvironmentManagerChildResources.template


### InfraAsgScale

Maintains a list of currently active servers in each AutoScalingGroup. It does this by listening to AutoScaling events, and refreshing a dynamoDB table.

This has the advantages:
- Can support maintenance mode independently of the AutoScalingGroup Standby feature. 
- Consolidates a view of ASGs across multiple child accounts, for centralised management, such as DNS updates (DNS update code not included).
- Reduces calls to the AutoScaling API.

To Install:

- Edit the file to indicate if it is the master account copy, or a child account. If it is the child account copy, you will need to provide the account number of your master account. 
- Zip the file with the dependencies and upload to Lambda, or via S3 if you prefer.
- When you configure the service in AWS Lambda:
    - CONFIGURATION
    - Runtime: NodeJS
    - Handler: index.Handler
    - Role: Choose existing:
        - roleInfraAsgScale
    - Description: Updates DynamoDB InfraASGIPs table with active instances in each ASG, when they change.
    - RAM: 128MB
    - Timeout: 8 seconds 
    - NO VPC needed. 
    
    The above settings worked fine for 1000+ instances in our test environment. 
    
    - TRIGGERS
    - Choose the SNS notification source InfraASGLambdaScale SNS topic
    - Add a new Cloudwatch Event. You might need to enable CloudWatch Events on your account if it is not already configured. 
    - The Event pattern is:
```
{
  "detail-type": [
    "AWS API Call via CloudTrail"
  ],
  "detail": {
    "eventSource": [
      "autoscaling.amazonaws.com"
    ],
    "eventName": [
      "EnterStandby",
      "ExitStandby",
      "UpdateAutoScalingGroup"
    ]
  }
}
```
You need one copy of this per account, if you have multiple environments in one account, then only 1 copy of the script will be needed.

[Next (Configuration File) >](/environment-manager/docs/app-setup/config-file)