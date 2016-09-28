---
title: Consul
layout: docs
weight: 70
---

### Usage

Environment Manager uses [Consul](https://www.consul.io/) for:

- Service discovery
- Service health checking
- Deployment
- [Maintenance Mode](/environment-manager/docs/concepts#services)

For deployment, the Key Value store is used to hold the target services that should be deployed, and the Catalogue holds what is currently/actually deployed. The Environment Manager deployment agent running on each instance then simply looks for differences between these two sources and downloads and installs any missing packages to converge the state. This provides a highly scalable and concurrency safe deployment platform.

Further information about how deployment with Consul can be found [here](/environment-manager/docs/more/consul).

### Setup

First of all you need a set of Consul Masters, you can follow the instructions here (https://www.consul.io/intro/getting-started/install.html).

The number of Consul masters depend on the redundancy you want to have, our recommendation is to keep always an odd number of Consul masters to ensure Quorum, as a guideline we use 1 for development, 4 for testing and 5 for Production).

Environment Manager supports as many Consul Masters (datacentres) as you need, so follow the most logical way for your environment. For example, if you restrict traffic within each VPC then having a datacentre per VPC makes sense. You could also have one data centre per account as long as your network rules allow the Consul agents to form a coherent mesh network over port 8500 to all machines in that account. Having Consul datacentres that span different accounts is not necessarily recommended as higher latency can cause problems maintaining Consul connectivity.

### Security

Consul supports security measures through different methods, the only one that is of concern to Environment Manager is the [ACL model](https://www.consul.io/docs/internals/acl.html).

Environment Manager uses ACLs to protect the Key Value store sections that hold target state for deployments. If this is not protected, it’s possible other scripts or users in your estate could add or modify this data in a way that creates an inconsistent deployment state.

If you decide to use ACLs there are 3 policies that you can apply:

- Policy that allows Environment Manager to write new deployment state
- Policy that allows the Deployment Agent running on instances to read deployment state and upload deployment logs
- Policy that allows Upstreamer to read target deployment state

These policies can be found in GIT LINK:here.

[Next (NGINX) >](/environment-manager/docs/setup/nginx)