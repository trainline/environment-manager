---
title: What is Environment Manager?
layout: overview
weight: 10
---

Environment Manager empowers development teams to perform AWS infrastructure operations and deploy code themselves.

Unlike most solutions that focus solely on the technical aspects of continuous delivery, it also provides the visibility, control and governance needed for management to confidently support this cultural change.

It offers a minimally opinionated platform - enabling continuous delivery for a wide variety of software components into AWS with the minimum amount of remediation work. This allows applications to move to the Cloud faster, bringing forward the realisation of the benefits whilst reducing the expensive dual running phase.

Features include blue/green, canary and overwrite deployments; Windows and Linux support, multi-tenancy support; a comprehensive API for scripting deployments into pipelines; SNS events, as well as audit and access control capabilities suitable for a PCI Level 1 organisation.

Environment Manager is made up of the following components:

- An easy-to-use website that enables development teams to perform common infrastructure tasks themselves. This includes creating and refreshing environments, deploying applications, and managing load balancer rules.
- A set of APIs for integrating deployment and management features into pipelines and other automation/tooling
- A command line utility that wraps the API and makes it even easier to include desired behaviour in pipelines and related scripts
- A range of operational, governance and security elements that improve visibility and control of configuration and environment changes
- A time-zone aware scheduler that can turn environments or selected servers on or off as required to help manage costs

![](/environment-manager/assets/images/deployment-map.png)

[Next (Features and Benefits) >](/environment-manager/overview/features)