---
title: AWS Setup
layout: docs
weight: 20
---

It is recommended to use separate AWS Accounts and VPCs for each [Link:Environment Type] (e.g. Dev, Staging, Prod etc.) as this provides the cleanest separation of resources and prevents any single account becoming too large.

One AWS account should be nominated as the ‘master’ account. This will host the Environment Manager application that will work across all 'child' AWS accounts.

The master account should contain a ‘Management’ VPC that is peered with all other accounts. This provides Environment Manager the access it needs to manage resources across all environment types. Other accounts can be peered with each other or not as appropriate to your needs.

The recommended VPC setup is shown in the diagram below where each VPC lives within its own AWS Account:

![AWS Setup](/environment-manager/assets/images/aws-setup.png)

Notes:

-	The minimum number of AWS accounts recommended is 2 – Production and Non-Production. You can configure multiple non-production VPCs in one account, and have the Production and Management VPCs in another. The management VPC still needs to be peered with all VPCs in both accounts.
-	Other configurations of NGINX and Consul are possible - these are discussed in later sections.
