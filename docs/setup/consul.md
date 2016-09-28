---
title: Consul
layout: docs
weight: 70
---

### Usage

Environment Manager uses [Link: Consul] for:

- Service discovery
- Service health checking
- Deployment
- [Link: Maintenance Mode]

For deployment, the Key Value store is used to hold the target services that should be deployed, and the Catalogue holds what is currently/actually deployed. The Environment Manager deployment agent running on each instance then simply looks for differences between these two sources and downloads and installs any missing packages to converge the state. This provides a highly scalable and concurrency safe deployment platform.

Further information about how deployment with Consul can be found [LINK: deployment info].

### Setup

First of all you need a set of Consul Masters, you can follow the instructions here (https://www.consul.io/intro/getting-started/install.html).

The number of Consul masters depend on the redundancy you want to have, our recommendation is to keep always an odd number of Consul masters to ensure Quorum, as a guideline we use 1 for development, 4 for testing and 5 for Production).

Environment Manager supports as many Consul Masters (datacentres) as you need, so follow the most logical way for your environment. For example, if you restrict traffic within each VPC then having a datacentre per VPC makes sense. You could also have one data centre per account as long as your network rules allow the Consul agents to form a coherent mesh network over port 8500 to all machines in that account. Having Consul datacentres that span different accounts is not necessarily recommended as higher latency can cause problems maintaining Consul connectivity.

