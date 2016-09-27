---
title: Installation and Setup Guide
layout: docs
weight: 10
---

Unfortunately, installing EM isn’t yet an easy process. It interacts with a lot of other technologies that need to be setup and connected correctly for end-to-end processes such as deployment to work. You will need some patience and a good level of technical skill – especially with AWS. Future releases will aim to improve and automate more of this setup process.

![Not simple](/environment-manager/assets/images/not-simple.png)

This installation guide presents an opinionated tutorial on what we believe is the best way to configure EM. There are many other ways this can be done, some of which are noted in the guide. All tutorials assume you are configuring the tool as suggested.

If you have not already done so, it is recommended that you read the [Link:Concepts] section first.

### Overview

Installing Environment Manager requires setup and configuration of the following:

-	AWS
 * Master AWS Account
 * Slave AWS Account(s)
-	Consul
-	Active Directory
-	Environment Manager application
-	Machine images ([Link:AMIs])
-	Configuration Management tooling
-	Optional, if you want EM to manage load balancer rules:
 * NGINX
 * Upstreamr (a dynamic config loader for NGINX)

Each of these areas are explained in the sections below.
