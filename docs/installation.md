---
title: Installation and Setup Guide
layout: docs
weight: 40
---

<img src="/environment-manager/assets/images/not-simple.png" style="float:right; padding-left: 2em" />

Unfortunately, installing EM isn’t yet an easy process. It interacts with a lot of other technologies that need to be setup and connected correctly for end-to-end processes such as deployment to work. You will need some patience and a good level of technical skill – especially with AWS. Future releases will aim to improve and automate more of this setup process.

This installation guide presents an opinionated tutorial on what we believe is the best way to configure EM. There are many other ways this can be done, some of which are noted in the guide. All tutorials assume you are configuring the tool as suggested.

If you have not already done so, it is recommended that you read the [Link:Concepts] section first.

### Overview

Installing Environment Manager requires setup and configuration of the following:

-	AWS
    - Master AWS Account
    - Child AWS Account(s)
-	Consul
-	Active Directory
-	Environment Manager application
-	Machine images ([Link:AMIs])
-	Configuration Management tooling
-	Optional, if you want EM to manage load balancer rules:
    - NGINX
    - Upstreamr (a dynamic config loader for NGINX)

Each of these areas are explained in the sections below.

## Lambda Functions

This project contains code for the following Lambda Functions

<table>
    <tr><th>Lambda Function</th><th>Description</th></tr>
    <tr><td>InfraDynamoStreamReplica</td><td>Replicates data from each of the DynamoDB tables in your master account to the corresponding table in each of your child accounts</td></tr>
    <tr><td>InfraEnvironmentManagerAudit</td><td>Writes audit events that occur in your child accounts to a DynamoDB table in your master account</td></tr>
    <tr><td>InfraEnvironmentManagerScheduler</td><td>Schedules Auto Scaling Groups</td></tr>
</table>

The Lambda Functions included in this project must be customized to your target environment, packaged as .zip files and uploaded to an S3 location readable by the account in which they will be created. 

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
1. Create a new CloudFormation stack using [EnvironmentManagerCommonResources.template]
1. Once the previous stack has been created, create a new CloudFormation stack using [EnvironmentManagerMasterResources.template]
1. If the master account is also a child account i.e. it will deploy services to itself, follow the instructions below.

### Child Account

The following steps will create the resources necessary for the Environment Manager running in your master account to administer and monitor auto scaling groups and services in this child account.

1. Upload `InfraEnvironmentManagerAudit.zip` and `InfraEnvironmentManagerScheduler.zip` to the `/EnvironmentManager` folder in the S3 bucket that contains your Lambda function code for your child account.
1. Create a new CloudFormation stack using [EnvironmentManagerCommonResources.template]
1. Once the previous stack has been created, create a new CloudFormation stack using  [EnvironmentManagerChildResources.template]

[child]: https://github.com/trainline/environment-manager/blob/master/setup/cloudformation/EnvironmentManagerChildResources.template
[common]: https://github.com/trainline/environment-manager/blob/master/setup/cloudformation/EnvironmentManagerChildResources.template
[master]: https://github.com/trainline/environment-manager/blob/master/setup/cloudformation/EnvironmentManagerChildResources.template
[InfraDynamoStreamReplica/index.js]: https://github.com/trainline/environment-manager/blob/master/lambda/InfraDynamoStreamReplica/index.js
[InfraEnvironmentManagerAudit/index.js]: https://github.com/trainline/environment-manager/blob/master/lambda/InfraEnvironmentManagerAudit/index.js
[EnvironmentManagerCommonResources.template]: https://github.com/trainline/environment-manager/blob/master/setup/cloudformation/EnvironmentManagerCommonResources.template
[EnvironmentManagerMasterResources.template]: https://github.com/trainline/environment-manager/blob/master/setup/cloudformation/EnvironmentManagerMasterResources.template