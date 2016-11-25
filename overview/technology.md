---
title: Technology Overview
layout: overview
weight: 21
---

Under the hood Environment Manager is built with the following technologies:

-	The self-service console is an AngularJS web application backed by a set of NodeJS APIs
-	Lambda functions help with housekeeping and ancillary tasks such as instance scheduling
-	Consul is used for service discovery, health checks and deployment
-	Configuration is held in DynamoDB
-	Users are authenticated against an LDAP directory (e.g. Active Directory)

The diagram below shows a logical view of the application architecture.

![](/environment-manager/assets/images/arch.png)

[Next (Assumptions and Limitations) >](/environment-manager/overview/assumptions)