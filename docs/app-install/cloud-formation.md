---
title: Cloud Formation
layout: docs
weight: 10
---

Customise and upload the Lambda Functions, then customise the CloudFormation templates and create the stacks.

### Lambda Functions

This project contains code for the following Lambda Functions

<table>
    <tr><th>Lambda Function</th><th>Description</th></tr>
    <tr><td>InfraAsgScale</td><td>Resizes auto scaling groups on a schedule</td></tr>
    <tr><td>InfraDynamoStreamReplica</td><td>Replicates data from each of the DynamoDB tables in your master account to the corresponding table in each of your child accounts</td></tr>
    <tr><td>InfraEnvironmentManagerAudit</td><td>Writes audit events that occur in your child accounts to a DynamoDB table in your master account</td></tr>
    <tr><td>InfraEnvironmentManagerScheduler</td><td>Schedules Auto Scaling Groups</td></tr>
</table>

The Lambda Functions included in this project must be customized to your target environment, packaged as .zip files and uploaded to an S3 location readable by the account in which they will be created. 

1. Configure the InfraAsgScale Lambda function to use your master account. Edit [InfraAsgLambdaScale/index.js][InfraAsgLambdaScale/index.js]; assign the AWS account ID of your master account to `MASTER_ACCOUNT`.
1. Configure the InfraDynamoStreamReplica Lambda function to replicate data from the DynamoDB tables in your master account to each of your child accounts. Edit [InfraDynamoStreamReplica/index.js][InfraDynamoStreamReplica/index.js]; assign an array of the AWS account ID of each of your child accounts to `DESTINATION_ACCOUNTS`.
1. Configure the InfraEnvironmentManagerAudit Lambda function to write audit events to your master account. Edit [InfraEnvironmentManagerAudit/index.js][InfraEnvironmentManagerAudit/index.js]; assign the AWS account ID of your master account to `DESTINATION_ACCOUNT_ID`.
1. Run `npm install` in the root directory of each Lambda function and archive the contents (excluding `package.json`) to a zip file by the same name as the root directory.

## CloudFormation

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