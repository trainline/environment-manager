---
title: Trouble shooting
layout: docs
weight: 70
---

### Why is my Deployment stuck with "In Progress" state?

Environment Manager app is responsible for creating infrastructure (creating Launch Configuration and Auto Scaling Group), defining target state of your Auto Scaling Group, and then orchestrating server agents. Most problems at this stage will have to do with instance deployment agent. If you use Consul for service state / discovery, that would be `consul-deployment-agent`.

### My deployments are slow, what's wrong?

The first time you deploy a service to an Auto Scaling Group, Environment Manager will create infrastructure and delegate deploying services to instance agents. Depending on your instance configuration, it might take a while for machine to bootstrap and consul agent to pick up deployment info.

### I updated settings for my Server Role in Deployment Map, but new instances in my Auto Scaling Group are still running with old settings, why?

Server Role settings for Deployment Map are used as a template when creating new instance Launch Configuration for a new Auto Scaling Group. To modify Launch Configuration of existing Auto Scaling Group, please use "Launch Configuration" in live Auto Scaling Group details view - #/environment/servers/.
