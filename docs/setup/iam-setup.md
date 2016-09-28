---
title: IAM Setup
layout: docs
weight: 50
---

Environment Manager runs under an IAM instance profile role in the master account called roleInfraEnvironmentManager. It uses cross-account trust to assume the IAM role roleInfraEnvironmentManagerChild to perform actions in each child account.
This can be setup as follows:

### Master Account

1.	Download the roleInfraEnvironmentManagerPolicy IAM policy from git
2.	Modify the policy file to replace the variables with values appropriate to your setup:
    - [MASTER-ACCOUNT-ID] – the AWS account ID for the master account
    - [CONFIG-BUCKET] – bucket/path for config 
    - [SECURE-BUCKET] – bucket/path for secure credentials
    - [BACKUP-BUCKET] – bucket/path for EM backups
    - [CHILD-ACCOUNT-ID] – Add a separate row and update the account number for each child AWS account
3.	Setup a new IAM policy from the AWS Console
    - Create a new Policy named: roleInfraEnvironmentManagerPolicy
    - Select ‘Create your own policy’ and upload the modified policy JSON
4.	Setup a new IAM role from the AWS Console
    - Name: roleInfraEnvironmentManager
    - Role Type: AWS Service Roles\Amazon EC2
    - Policy: select the “roleInfraEnvironmentManagerPolicy” created in step 3

Note: Be sure to check the setup of the S3 buckets themselves in case they include additional protections that prevent access. Bucket level permissions can prevent access even if an IAM role is granted explicit access to a location. 
You can use the [AWS Policy Simulator](https://policysim.aws.amazon.com/) to test that the IAM roles have the appropriate S3 access.

### Child Accounts

1.	Download the roleInfraEnvironmentManagerChildPolicy IAM policy from git
2.	For each child account:
    - Modify the policy file to replace the variables with values appropriate to your setup:
        - [DEPLOY-BUCKET] – bucket/path for storing deployment packages
        - [LOGS-BUCKET] – bucket/path for installation log files
    - Setup a new IAM policy from the AWS Console
        - Create a new Policy named: roleInfraEnvironmentManagerChildPolicy
        - Select ‘Create Your Own Policy’ and upload the modified policy JSON
    - Setup a new IAM role from the AWS Console
        - Name: roleInfraEnvironmentManagerChild
        - Role Type: Role for Cross-Account Access\Provide access between AWS accounts you own.  Enter your master account number.
        - Policy: select the roleInfraEnvironmentManagerChildPolicy created in step 2.b. above.

A simple test to check the cross-account role trust is setup correctly in the child accounts can be done by using the AWS Policy Simulator when logged into the master account:

1.	Login to your master AWS account
2.	Go to https://policysim.aws.amazon.com/ in your preferred browser
3.	Select ‘roleInfraEnvironmentManager’ under the Users, Groups, and Roles section
4.	Select ‘Security Token Service’ and action ‘AssumeRole’ under the Policy Simulator section
5.	In the Resource box, input the ARN of the roleInfraEnvironmentManagerChild role
6.	Click ‘Run Simulation’.  If the result is ‘allowed’ the trust relationship is correctly setup

### Lambda Jobs

Environment Manager also includes some ancillary Lambda jobs, each of which runs under a dedicated least privilege IAM role.

For each Lambda function, the table below shows the policy file to download, the variables to replace and the role that should be created and associated with the policy.

<table>
<tbody>
<tr>
<td width="127">
<p><strong>Purpose</strong></p>
</td>
<td width="109">
<p><strong>Accounts</strong></p>
</td>
<td width="121">
<p><strong>Source Code</strong></p>
</td>
<td width="122">
<p><strong>CloudFormation Template</strong></p>
</td>
<td width="121">
<p><strong>Customisations Required</strong></p>
</td>
</tr>
<tr>
<td width="127">
<p>Scheduler</p>
</td>
<td width="109">
<p>All</p>
</td>
<td width="121">
<p><a href="https://github.com/trainline/environment-manager/tree/master/lambda/InfraEnvironmentManagerScheduler">InfraEnvironmentManagerScheduler</a></p>
</td>
<td width="122">
<p><a href="https://github.com/trainline/environment-manager/blob/feature/restructure-folders/setup/cloudformation/EnvironmentManagerChildResources.template">EnvironmentManagerChildResources</a></p>
</td>
<td width="121">
<p>None</p>
</td>
</tr>
<tr>
<td width="127">
<p>Audit</p>
</td>
<td width="109">
<p>All</p>
</td>
<td width="121">
<p><a href="https://github.com/trainline/environment-manager/tree/master/lambda/InfraEnvironmentManagerAudit">InfraEnvironmentManagerAudit</a></p>
</td>
<td width="122">
<p><a href="https://github.com/trainline/environment-manager/blob/feature/restructure-folders/setup/cloudformation/EnvironmentManagerCommonResources.template">EnvironmentManagerCommonResources</a></p>
</td>
<td width="121">
<p>Edit roleInfraEnvironmentManagerAuditWriter. Allow this role in your master account to be assumed by each of your child accounts (see comments in CloudFormation template).</p>
<p>&nbsp;</p>
<p>Edit InfraEnvironmentManagerAudit/index.js. Set DESTINATION_ACCOUNT_ID to the AWS account ID of your master account (string)</p>
</td>
</tr>
<tr>
<td width="127">
<p>Backup</p>
</td>
<td width="109">
<p>Master</p>
</td>
<td width="121">
<p>&nbsp;</p>
</td>
<td width="122">
<p>&nbsp;</p>
</td>
<td width="121">
<p>&nbsp;</p>
</td>
</tr>
<tr>
<td width="127">
<p>Dynamo Replication</p>
</td>
<td width="109">
<p>Master</p>
</td>
<td width="121">
<p><a href="https://github.com/trainline/environment-manager/tree/master/lambda/InfraDynamoStreamReplica">InfraDynamoStreamReplica</a></p>
</td>
<td width="122">
<p><a href="https://github.com/trainline/environment-manager/blob/feature/restructure-folders/setup/cloudformation/EnvironmentManagerCommonResources.template">EnvironmentManagerCommonResources</a></p>
</td>
<td width="121">
<p>Edit roleInfraDynamoStreamReplica. Allow this role in your master account to assume roleInfraDynamoStreamReplicaWriter in each child account (see comments in CloudFormation template).</p>
<p>&nbsp;</p>
<p>Edit InfraDynamoStreamReplica/index.js. Set DESTINATION_ACCOUNTS to an array of the AWS account ID of each of your child accounts.</p>
</td>
</tr>
</tbody>
</table>

### Instance Profiles

The instances that are dynamically created by Environment Manager also require certain permissions in order to deploy applications. Specifically, the deployment agent needs to download the packages to install from S3, and to write back installation logs to S3 following deployment. This is achieved using [instance profiles](http://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2_instance-profiles.html).

As this is a common requirement regardless of what applications are being deployed on the servers, it is recommended to create a Common IAM Policy and attach it to all Instance Profiles (in addition to whatever specific permissions may be required for each application).

Note that the common policy may vary slightly between accounts as the locations for packages and logs in S3 can change per account. It is recommended that this be abstracted out and scripted but this is not mandatory for EM setup.

The steps below create a test Instance Profile that can be used for testing deployment later.

1.	Download the CommonInstanceProfile IAM policy from git
2.	For each Child Account:
    - Modify the policy file to replace the variables with values appropriate to your setup:
        - [DEPLOY-BUCKET] – bucket/path for storing deployment packages
        - [LOGS-BUCKET] – bucket/path for installation log files
    - Setup a new IAM policy from the AWS Console
        - Create a new Policy named: CommonInstanceProfile
        - Select ‘Create your own policy’ and upload the modified policy JSON
    - Setup a test IAM policy/role from the AWS Console:
        - Name: roleDeploymentTest
        - Role Type: AWS Service Roles\Amazon EC2
        - Policy: select the “CommonInstanceProfile” created above

[Next (Active Directory) >](/environment-manager/docs/setup/active-directory)