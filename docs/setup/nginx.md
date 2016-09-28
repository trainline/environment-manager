---
title: NGINX
layout: docs
weight: 90
---

### Usage

Environment Manager currently assumes the use of NGINX for:

- Load Balancer configuration (i.e. [Link:LB Settings] and [Link:LB Upstreams])
- Blue/Green deployment toggling
- The Upstream Status report - showing which slices (blue or green) are currently active for each service

Our NGINX servers include scripts that frequently poll Environment Manager’s APIs, read LB Settings and Upstream changes and update the running configuration to match. A similar approach could be used for other load balancer solutions if you are not using NGINX. 

The only part of Environment Manager specific to NGINX is the Upstream Status report where it calls the NGINX API to read the current state of services. This should also be easy to modify to an alternative solution.

Note that most facilities in Environment Manager including deployment can be done without NGINX so the steps below are optional for getting started.

### Setup

To setup nginx should be fairly standard. Environment Manager (through Upstreamr) can do the configuration for both services (virtual hosts or routes) and upstreams (servers behind that virtual host or route).

To install nginx you only need to install the package in your OS, please follow the instructions here (https://www.nginx.com/resources/wiki/start/topics/tutorials/install/)

There is no need to modify any of the default parameters, just make certain that you include as part of your nginx configuration the directories in which your config files will be written to by Upstreamr (we use /etc/nginx/upstreamr.d to differentiate them).

[Next (Upstreamr) >](/environment-manager/docs/setup/upstreamr)