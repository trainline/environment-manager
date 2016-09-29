---
title: Child Accounts
layout: docs
weight: 6
---


The diagram below summarises the Environment Manager components deployed to each Child AWS Account.

![Child Accounts](/environment-manager/assets/images/child-accounts.png)

Each element is described briefly below.

<table>
  <thead>
    <tr>
      <th width="25%">
        Element
      </th>
      <th>
        Description
      </th>
      <th>
        Notes
      </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <p>Consul</p>
      </td>
      <td>
        <p>Used for Service Discovery, health checking and deployment. Please see <a href="/environment-manager/docs/setup/consul">Consul</a></p>
      </td>
      <td>
        <p>&nbsp;</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>S3 Packages to Deploy</p>
      </td>
      <td>
        <p>A bucket or path that can be used to store packages for deployment.</p>
      </td>
      <td>
        <p>Environment Manager in the Master Account will upload packages to this location during deployment.</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>ASG/Application EC2</p>
      </td>
      <td>
        <p>Infrastructure created dynamically by Environment Manager during deployment to run application Services.</p>
      </td>
      <td>
        <p>&nbsp;</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>S3 Deployment Logs</p>
      </td>
      <td>
        <p>The bucket or path used to hold installation logs uploaded by the deployment agents from the EC2 instances.</p>
      </td>
      <td>
        <p>&nbsp;</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>Dynamo DB</p>
      </td>
      <td>
        <p>Stores infrastructure configuration and Environment Manager settings/state specific to this Child account.</p>
      </td>
      <td>
        <p>Tables should be locked down to prevent access that bypasses the Environment Manager Child IAM role. This avoids invalid or misconfigured data causing unexpected issues.</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>Lambda Change Audit Script</p>
      </td>
      <td>
        <p>Listens to Dynamo Streams for local Dynamo tables and maintains an audit record of changes in the Master Dynamo Audit table.</p>
      </td>
      <td>
        <p>Used for tracking who changed what and rolling back unwanted changes.</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>Lambda Instance Scheduling Script</p>
      </td>
      <td>
        <p>Environment Manager allows schedules to be set against Environments or particular ASGs. This Lambda function enforces and applies these schedules within the local account.</p>
      </td>
      <td>
        <p>&nbsp;</p>
      </td>
    </tr>
  </tbody>
</table>

<a href="#top">^ Back to top</a>

[Next (Cloud Formation) >](/environment-manager/docs/app-setup/cloud-formation)