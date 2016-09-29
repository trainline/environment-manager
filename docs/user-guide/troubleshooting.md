---
title: Trouble Shooting
layout: docs
weight: 30
---

**Why is my Deployment stuck with "In Progress" state?**

Environment Manager app is responsible for creating infrastructure (creating Launch Configuration and Auto Scaling Group), defining target state of your Auto Scaling Group, and then orchestrating server agents. Most problems at this stage will have to do with instance deployment agent. If you use Consul for service state / discovery, that would be `consul-deployment-agent`.

**My deployments are slow, what's wrong?**

The first time you deploy a service to an Auto Scaling Group, Environment Manager will create infrastructure and delegate deploying services to instance agents. Depending on your instance configuration, it might take a while for machine to bootstrap and consul agent to pick up deployment info.

**I updated settings for my Server Role in Deployment Map, but new instances in my Auto Scaling Group are still running with old settings, why?**

Server Role settings for Deployment Map are used as a template when creating new instance Launch Configuration for a new Auto Scaling Group. To modify Launch Configuration of existing Auto Scaling Group, please use "Launch Configuration" in live Auto Scaling Group details view - #/environment/servers/.

**Where are the logs?**

Logs are printed to standard output by default. You can adjust logging level by adjusting `EM_LOG_LEVEL` environment variable. We use Winston logger with 6 logging levels: `error`, `warn`, `info`, `verbose`, `debug`, and `silly`. It's set to `debug` on default. In production environment (that is, if environment variable IS_PRODUCTION is set to "true"), there are a few differences to logger:
- JSON is printed to output instead of simple text - that is to allow log parsers, like Logstash to gather additional metadata that can be then used to filter / analyse with log viewers like Kibana
- all communication with AWS and HTTP requests are logged (these are removed for local development to reduce noise)
