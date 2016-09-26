---
title: Features and Benefits
layout: overview-post
---

Environment Manager provides a higher-level abstraction over the top of AWS that aims to more closely fit the mental model of developers e.g. ‘I want to deploy this application to that environment’. It does not attempt to duplicate the functionality of the AWS Console, but instead provides an easier way to perform environment level operations.

Environment Manager has been designed to be as un-opinionated as possible. It supports a range of deployment methods including basic overwrite, blue/green, canaries, and immutable servers. Support for containers and Lambda functions are also on the roadmap. This flexibility makes it well suited to support organisations as they transition from older technologies to newer more modern architectures and tooling.

### Key Features:

-	Manage environments - who owns them, what they are for, what applications are deployed where
-	Manage infrastructure configuration - including change audit history and rollback
-	Deploy services flexibly using an innovative approach based around <LINK>Consul 
-	Schedule environments and servers to reduce costs when not in use
-	Manage load balancer rules and blue/green toggling
-	Scale and patch servers without downtime
-	Compare and synchronise environments e.g. view app versions deployed across Test, Staging and Production
-	Control permissions using fine-grained model based on resources, actions, environments and ownership

### Benefits:

-	Single source of truth/catalogue for environments and deployable components
-	Improved visibility and insight:
  -	Who has deployed what where?
  -	How out of date are the apps in my Test environment compared to Production?
  -	Which servers need to be patched?
-	Reduced waste: 
  -	Developers can perform tasks themselves rather than raising tickets and waiting
  -	Faster debugging of environment issues when they do occur
-	Reduced AWS costs as environments are turned off when not in use
-	Infrastructure standards e.g. for security, naming, tagging etc. applied automatically and consistently as part of deployment process

### Technology

Under the hood Environment Manager is an AngularJS web application backed by a set of NodeJS APIs. Infrastructure configuration is held in AWS DynamoDB and a set of Lamba functions help with housekeeping and ancillary tasks such as instance scheduling. More information can be found in the LINK:App Architecture section.

