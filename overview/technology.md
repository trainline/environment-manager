---
title: Technology Overview
layout: overview
weight: 21
---

Environment Manager is built with the following technologies:
- Node/AngularJS for the web application and APIs
- Consul for service discovery, health checks and deployment
- NGINX for load balancing (other options possible)
- Lambda for housekeeping and ancillary tasks such as environment scheduling
- DynamoDB for storing configuration data
- SNS for raising environment level events such as configuration changes and deployments
- LDAP for user authentication (e.g. Active Directory)
The diagram below shows a logical view of the application architecture.

![](/environment-manager/assets/images/arch-small.png)
