---
title: Assumptions and Limitations
layout: overview
weight: 30
---

Environment Manager is best suited to companies with between 100 and 5,000 servers running a mixture of legacy and more modern applications.

The major assumptions are that:

-	All infrastructure must be hosted in AWS (no hybrid or other Cloud providers are supported)
-	All EC2 instances are deployed into [Link:Auto-Scaling Groups] for easier management
-	Consul is used for service discovery, health checks and deployment
-	Active Directory/LDAP is used to authenticate users within the tool and detect group membership for permissions
-	NGINX is used for load balancing

Dependencies have largely been designed to be pluggable, so if you prefer an alternative technology it should be supportable with relatively minor code changes. Similarly, Trainline specific standards (e.g. for how instances are named and tagged) can be adjusted to suit your own requirements with some small development effort.

No consideration has been made for Cloud platforms other than AWS, or any kind of hybrid infrastructure.

Additional limitations to note:

-	Only EC2 instances are supported, ECS Container and Lambda support will follow
-	Only a single AWS Region is supported, though it can be any region you wish. Multi-region support is planned
-	There is no explicit uninstall API - which is not as much of a problem in practice as it sounds. This feature is coming soon.

Additional assumptions:

-	Custom AMIs used for deployment are assumed to be available for all [Link: Child AWS Accounts]. EM does not currently support selecting different AMIs depending on the target account.
-	Deployed EC2 instances have CloudWatch Enhanced Monitoring turned on automatically. If you don’t want this, you can disable this part of the code
-	Environment Manager makes a number of assumptions about the AWS resource naming conventions. These are described in the [LINK: Conventions section] and can be modified in code as necessary to support your preferences
-	Packages for deployment are assumed to be in AWS CodeDeploy zip format http://docs.aws.amazon.com/codedeploy/latest/userguide/app-spec-ref.html. This is a simple format that is agnostic to the platform or technologies being deployed.
