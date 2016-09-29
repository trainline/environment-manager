---
title: Consul Deployments
layout: docs
weight: 11
---

### Overview

In order to understand how deployment works, it is useful to first have a good understanding of Consul <https://www.consul.io/>.

Consul is primarily a service discovery and health checking platform. A queryable Catalog maintains the current state of an environment including member nodes, services deployed and service health.

Consul also includes a consistent key value store that can be used to hold arbitrary application data.

Environment Manager makes use of the key value store to manage desired target state for deployments i.e. which application services should be deployed where.

A deployment agent running on AWS instances then simply compares the Consul catalog (containing actual service state) with the key value store (containing desired state) and automatically trigger any deployments necessary to converge the states. Any updates to the key value store get picked up immediately by affected machines.

The diagram below shows a simplified logical view of how these components interact during deployment: 

![Consul Interaction](/environment-manager/assets/images/consul.png)

### Benefits

The benefits of this approach are as follows:

-	Fast and scalable. No limits on how many deployments can be performed in parallel, leading to faster environment provisioning.
-	Multi-tenancy support. The agent can deploy any number application services to the same machine (up to the limits of the instance type being deployed to)
-	Concurrency safe. The agent works one service at a time, meaning it will safely handle requests to deploy multiple services to the same machine at the same time.
-	Cross platform - agent supports Windows and Linux 
-	Native integration with Consul health checks for deployed services
-	Dynamic environment/auto-scaling support. With the AWS Code Deploy service for example, there is a risk of a race condition when deploying and scaling up at the same time. This solution ensures all servers converge to the same software version(s) regardless of scaling events
-	Clear progress and logs surfaced via Environment Manager GUI