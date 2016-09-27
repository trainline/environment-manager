---
title: Features and Benefits
layout: overview
featured: images/arch.png
weight: 20
---

Environment Manager provides a higher-level abstraction over the top of AWS that aims to more closely fit the mental model of developers e.g. ‘I want to deploy this application to that environment’. It does not attempt to duplicate the functionality of the AWS Console, but instead provides an easier way to perform environment level operations.

Environment Manager has been designed to be as un-opinionated as possible. It supports a range of deployment methods including basic overwrite, blue/green, canaries, and immutable servers. Support for containers and Lambda functions are also on the roadmap. This flexibility makes it well suited to support organisations as they transition from older technologies to newer more modern architectures and tooling.

### Key features/benefits include:

-	Developers save time by deploying new services flexibly and reliably using an innovative approach based around <LINK>Consul
-	Create and refresh entire environments, trigger deployments across one or more servers with full visibility into deployment progress and issues
-	Reduce downtime with built in health-checks that alert and automatically remove misbehaving applications from the service pool
-	Manage environments - who owns them, what they are for, what applications are deployed where
-	Minimise the likelihood and impact of errors using blue/green and canary deployments
-	Improved visibility and control, including change audit history and rollback, leads to faster diagnosis of issues when they do occur
-	In-built capabilities to determine the age of AMIs help improve security compliance
-	Reduced AWS costs by scheduling servers and/or environments to be turned off when not in use
-	Reduced AWS costs through efficient multi-tenancy support
-	Support staff save time by scaling and patching servers without downtime
-	Compare and synchronise environments e.g. view app versions deployed across Test, Staging and Production
-	Improved manageability through the automatic application of infrastructure standards e.g. for security, naming, tagging etc. as part of deployment process
-	Fine grained permissions model based on resources, actions, environments and ownership

### Technology

Under the hood Environment Manager is built with the following technologies:

-	The self-service console is an AngularJS web application backed by a set of NodeJS APIs
-	Lambda functions help with housekeeping and ancillary tasks such as instance scheduling
-	Consul is used for service discovery, health checks and deployment
-	Configuration is held in DynamoDB
-	Active Directory is used to authenticate users within the tool and detect group membership

The diagram below shows a logical view of the application architecture.


