---
title: Conventions
layout: docs
weight: 30
---

This page lists the default conventions that Environment Manager uses for AWS resource naming and tagging. These can be modified in the code to suit your own requirements.

### Auto-Scaling Groups

Auto-scaling Groups are named using the following pattern:

    Environment Name (3) - Cluster Code (2) - Server Role (N)

For example, “d01-ex-Worker” would represent an ASG in the Development environment d01 owned by the Cluster/Team ‘Example’ and running Worker services.

### Launch Configurations

Launch Configurations are named exactly after their corresponding Auto-scaling Group but with a "LaunchConfig_" prefix. E.g. "LaunchConfig_d01-ex-Worker".

### EC2 Instances 

EC2 instances within ASGs are named as follows:

    EnvironmentName (3) – Cluster Code (2) – Instance ID (without ‘i-‘)

For example, d01-ex-19429ab5

### AMIs

Environment Manager requires images names to include SemVer (LINK: http://semver.org/) versioning so it can make intelligent recommendations and alerts when servers are out of date.

The naming pattern for AMIs is shown in the regular expression below:
[a-zA-Z0-9.-]+-[0-9]+\.[0-9]+\.[0-9]

Essentially this means some number of letters (including ‘.’ or ‘-‘ as required) suffixed by a dash and SemVer version. The following names are all valid examples:

- Windows-2012-5.0.0
- Ubuntu-16.04-LTS-1.0.0
- RHEL-7-NodeJS-3.2.1

### Tagging

The following tags are applied to ASGs and EC2 Instances:

<table>
  <thead>
    <th>Tag Name</th>
    <th>Description</th>
    <th>Example</th>
  </thead>
  <tbody>
    <tr>
      <td>
        <p><strong>EnvironmentType</strong></p>
      </td>
      <td>
        <p>Type of environment</p>
      </td>
      <td>
        <p>For example: Production, Dev, Integration</p>
      </td>
    </tr>
    <tr>
      <td>
        <p><strong>Environment</strong></p>
      </td>
      <td>
        <p>Name of environment</p>
      </td>
      <td>
        <p>Environment naming is configurable as part of Environment Type setup.</p>
        <p>We tend to use lower case letters followed by numeric identifier e.g. d01-d99 for development environments.</p>
      </td>
    </tr>
    <tr>
      <td>
        <p><strong>SecurityZone</strong></p>
      </td>
      <td>
        <p>Security Zone in which the instance will reside (See&nbsp;LINK:Concept for more information)</p>
      </td>
      <td></td>
    </tr>
    <tr>
      <td>
        <p><strong>OwningCluster</strong></p>
      </td>
      <td>
        <p>Owning Cluster (i.e. team) name</p>
      </td>
      <td></td>
    </tr>
    <tr>
      <td>
        <p><strong>ContactEmail</strong></p>
      </td>
      <td>
        <p>The&nbsp;group&nbsp;email address that should receive any alerts related to this server.</p>
      </td>
      <td>
        <p>Group email address for owning team</p>
      </td>
    </tr>
    <tr>
      <td>
        <p><strong>Role</strong></p>
      </td>
      <td>
        <p>Description of the purpose/function/type of the server. What does it do?</p>
      </td>
      <td>
        <p>Often same as service name for single-tenancy deploys</p>
      </td>
    </tr>
    <tr>
      <td>
        <p><strong>Schedule</strong></p>
      </td>
      <td>
        <p>Tag used for instance scheduling. Leave blank to use parent Environment default schedule.</p>
      </td>
      <td>
        <p>Set of</p>
        <p>Start: &lt;CRON&gt;;</p>
        <p>Stop: &lt;CRON&gt;</p>
        <p>If you need to disable scheduling temporarily, use</p>
        <p>NOSCHEDULE</p>
        <p>All times are in interpreted as UTC</p>
      </td>
    </tr>
  </tbody>
</table>

### Consul Service Names

Services registered with Consul during deployment are automatically named using the following pattern:

    EnvironmentName-ServiceName[-blue|green]

So for “ExampleService” in “d01” environment, the service would be called:

    d01-ExampleService

If it was deployed using [Link:Blue/Green mode], it would also be suffixed with the relevant slice. For example:

    d01-ExampleService-blue