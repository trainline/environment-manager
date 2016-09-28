---
title: IAM Setup
layout: docs
weight: 50
---

Environment Manager runs under an IAM instance profile role in the master account called roleInfraEnvironmentManager. It uses cross-account trust to assume the IAM role roleInfraEnvironmentManagerChild to perform actions in each child account.
This can be setup as follows:

### Master Account

1.	Download the roleInfraEnvironmentManagerPolicy IAM policy from git [here]
2.	Modify the policy file to replace the variables with values appropriate to your setup:
    - [CONFIG-BUCKET] – bucket/path for config 
    - [SECURE-BUCKET] – bucket/path for secure credentials
    - [BACKUP-BUCKET] – bucket/path for EM backups
    - [ACCNO] – Add a separate row and update the account number for each child AWS account
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

1.	Download the roleInfraEnvironmentManagerChildPolicy IAM policy from git [here]
2.	For each child account:
    a.	Modify the policy file to replace the variables with values appropriate to your setup:
        i.	[DEPLOY-BUCKET] – bucket/path for storing deployment packages
        ii.	[LOGS-BUCKET] – bucket/path for installation log files
    b.	Setup a new IAM policy from the AWS Console
        i.	Create a new Policy named: roleInfraEnvironmentManagerChildPolicy
        ii.	Select ‘Create Your Own Policy’ and upload the modified policy JSON
    c.	Setup a new IAM role from the AWS Console
        i.	Name: roleInfraEnvironmentManagerChild
        ii.	Role Type: Role for Cross-Account Access\Provide access between AWS accounts you own.  Enter your master account number.
        iii.	Policy: select the roleInfraEnvironmentManagerChildPolicy created in step 2.b. above.

A simple test to check the cross-account role trust is setup correctly in the child accounts can be done by using the AWS Policy Simulator when logged into the master account:

1.	Login to your master AWS account
2.	Go to https://policysim.aws.amazon.com/ in your preferred browser
3.	Select ‘roleInfraEnvironmentManager’ under the Users, Groups, and Roles section
4.	Select ‘Security Token Service’ and action ‘AssumeRole’ under the Policy Simulator section
5.	In the Resource box, input the ARN of the roleInfraEnvironmentManagerChild role
6.	Click ‘Run Simulation’.  If the result is ‘allowed’ the trust relationship is correctly setup

TODO: Merlin: Need policy files in our GIT repo to follow the conventions above so instructions work.

### Lambda Jobs

Environment Manager also includes some ancillary Lambda jobs, each of which runs under a dedicated least privilege IAM role.
TODO: unclear which lambdas run in which accounts
TODO: unclear what if any dynamic values need replacing in these lambda IAM policies
For each Lambda function, the table below shows the policy file to download, the variables to replace and the role that should be created and associated with the policy.
Purpose	Accounts	Policy File	Values to replace	Role to Create
Scheduler	All 	TODO: GIT LINK	TODO	
Audit	All			
Backup	Master			
Dynamo Replication	Master			

### Instance Profiles

The instances that are dynamically created by Environment Manager also require certain permissions in order to deploy applications. Specifically, the deployment agent needs to download the packages to install from S3, and to write back installation logs to S3 following deployment. This is achieved using [Link: instance profiles http://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_switch-role-ec2_instance-profiles.html].

As this is a common requirement regardless of what applications are being deployed on the servers, it is recommended to create a Common IAM Policy and attach it to all Instance Profiles (in addition to whatever specific permissions may be required for each application).

Note that the common policy may vary slightly between accounts as the locations for packages and logs in S3 can change per account. It is recommended that this be abstracted out and scripted but this is not mandatory for EM setup.

The steps below create a test Instance Profile that can be used for testing deployment later.

1.	Download the CommonInstanceProfile IAM policy from git [here] TODO: merlin: make this this is in Git
2.	For each Child Account:
    a.	Modify the policy file to replace the variables with values appropriate to your setup:
        i.	[DEPLOY-BUCKET] – bucket/path for storing deployment packages
        ii.	[LOGS-BUCKET] – bucket/path for installation log files
    b.	Setup a new IAM policy from the AWS Console
        i.	Create a new Policy named: CommonInstanceProfile
        ii.	Select ‘Create your own policy’ and upload the modified policy JSON
    c.	Setup a test IAM policy/role from the AWS Console:
        i.	Name: roleDeploymentTest
        ii.	Role Type: AWS Service Roles\Amazon EC2
        iii.	Policy: select the “CommonInstanceProfile” created above
