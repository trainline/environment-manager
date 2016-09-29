---
title: AWS Accounts
layout: docs
weight: 30
---

The following is general best practice for AWS account setup. These steps are optional and not required to run EM. They are listed below as recommendations for easier management of your Cloud estate:

-	Consolidate billing into a separate, dedicated billing AWS Account so that costs can be aggregated and analysed in a single place
-	Turn on CloudTrail to provide an audit log of account changes
-	Configure ADFS single sign-on. Ideally using the same AD authentication domain as will be used for Environment Manager logins. This means that access to all infrastructure actions whether directly on the AWS console or via EM can be managed through a single user account. [https://blogs.aws.amazon.com/security/post/Tx71TWXXJ3UI14/Enabling-Federation-to-AWS-using-Windows-Active-Directory-ADFS-and-SAML-2-0](https://blogs.aws.amazon.com/security/post/Tx71TWXXJ3UI14/Enabling-Federation-to-AWS-using-Windows-Active-Directory-ADFS-and-SAML-2-0)

### Master AWS Account

This section sets out the master AWS account pre-requisites:

**Network**

1.	Create a new VPC named ‘Management’
2.	Create at least one subnet within the Management VPC that will be used to host the EM servers
3.	Configure the network essentials – NAT, DNS, NTP etc. as appropriate to your environment
4.	If you choose to apply a NACL to the new subnet:
    a.	It is generally recommended to keep NACL rules fairly light and open to internal traffic whilst using Security Groups to provide tighter control.
    b.	The minimum requirements are:
      -	Incoming
        •	TCP 443 from your internal network - to allow other systems to call the EM APIs and browse the website
        •	TCP 1025-65535 0.0.0.0/0 – to allow return packets from AWS services such as S3
      -	Outgoing
        •	Active Directory ports to where your AD servers are hosted: http://blogs.msmvps.com/acefekay/2011/11/01/active-directory-firewall-ports-let-s-try-to-make-this-simple/
        •	TCP 8500 to all destinations in your AWS network that will fall under EM control. This allows access for Consul.
        •	TCP 443 to your NGINX servers in all environments
        •	AWS Services such as S3:
      -	TCP 80 (HTTP) to 0.0.0.0/0
      -	TCP 443 (HTTPS) to 0.0.0.0/0
      -	Plus whatever else you require in your environment e.g. ICMP, DNS, NTP etc.
5.	Setup an S3 [VPC endpoint](http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/vpc-endpoints.html)

**S3**

Environment Manager makes use of S3 in the master account for three different reasons:
-	To hold its application configuration file
-	To securely store credentials and access keys referenced by the configuration file. For example:
    -	Consul security tokens – for allowing access to alter Consul’s key-value store
    -	Active Directory service account – used for user authorisation
-	To store nightly backups of the EM configuration database. For each of these purposes, you will need to create or identify an S3 bucket/path that can be used to hold each type of data. These could all be under a single bucket using folders but we would recommend at least separating the secure data into its own bucket that has more specific access controls.

Notes

-	If your master account is also used for deployment (e.g. you have combined a Production VPC into the same account as the Management VPC), you will also need to run the non-network setup for a Child Accounts.
-	This covers account pre-requisites only, other AWS resource setup is described as part of the application installation.

### Child AWS Accounts

This section sets out the setup required for Child AWS Accounts. You can add multiple child accounts and change these in future as your environment types evolve.

**Network**

1.	Create a new VPC named after the type of [environment](/environment-manager/docs/concepts#environments) being hosted in this child account, for example: Dev, Staging, PerformanceTest etc.
2.	Create at least one subnet within the new VPC that will be used to host application servers
3.	Configure the network essentials – NAT, DNS, NTP etc. as appropriate to your environment
4.	If you choose to apply a NACL to the new subnet:
  a.	It is generally recommended to keep NACL rules fairly light and open to internal traffic whilst using Security Groups to provide tighter control.
  b.	The simplest configuration is to allow all traffic in/out of the Management VPC subnet/CIDR range.
  c.	The minimum requirements are:
    -	Incoming
      •	TCP Port 8500 - for Consul mesh network
      •	TCP 1025-65535 0.0.0.0/0 – to allow return packets from AWS services
    -	Outgoing
      •	AWS Services such as S3:
        -	TCP 80 (HTTP) to 0.0.0.0/0
        -	TCP 443 (HTTPS) to 0.0.0.0/0
      •	TCP 443 to Environment Manager (Management VPC subnet)
    -	Plus whatever else you require in your environment e.g. ICMP, DNS, NTP etc.
5.	Setup an S3 VPC endpoint http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/vpc-endpoints.html
6.	Peer the new VPC with the Management VPC in the master AWS Account http://docs.aws.amazon.com/AmazonVPC/latest/PeeringGuide/Welcome.html

**S3**

Create or identify two S3 buckets/paths:
-	Deployments location – for storing packages ready to be deployed 
-	Logs location – for storing deployment logs

**Keys**

Create EC2 Key Pairs for each development team in your organisation, or a sample team to begin with. These key pairs are used by Environment Manager when setting up the Launch Configurations for dynamically created ASGs.

[Next (IAM Setup) >](/environment-manager/docs/setup/iam-setup)