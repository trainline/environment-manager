---
title: Security
layout: docs
weight: 80
---

Consul supports security measures through different methods, the only one that is of concern to Environment Manager is the [ACL model](https://www.consul.io/docs/internals/acl.html).

Environment Manager uses ACLs to protect the Key Value store sections that hold target state for deployments. If this is not protected, it’s possible other scripts or users in your estate could add or modify this data in a way that creates an inconsistent deployment state.

If you decide to use ACLs there are 3 policies that you can apply:

- Policy that allows Environment Manager to write new deployment state
- Policy that allows the Deployment Agent running on instances to read deployment state and upload deployment logs
- Policy that allows Upstreamer to read target deployment state

These policies can be found in GIT LINK:here.
