---
title: Master Account
layout: docs
weight: 5
---

The diagram below summarises the Environment Manager components in the Master AWS Account.

![Master Account](/environment-manager/assets/images/master-account.png)

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
        <p>Elastic Load Balancer</p>
      </td>
      <td>
        <p>Balances traffic to the Auto-Scaling Group containing Environment Manager instances.</p>
      </td>
      <td>
        <p>We recommend adding a suitable certificate to make traffic HTTPS</p>
        <p>&nbsp;</p>
        <p>Security Group should allow incoming traffic from any network address requiring access to Environment Manager.</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>ASG/EC2 Instances</p>
      </td>
      <td>
        <p>Runs the Environment Manager application.</p>
      </td>
      <td>
        <p>An Environment Variable is set during app installation that specifies the S3 location to read the app config file from.</p>
        <p>&nbsp;</p>
        <p>Environment Manager instances communicate directly with all Child AWS accounts and instances.</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>S3 Configuration</p>
      </td>
      <td>
        <p>A bucket or path holding the Environment Manager configuration file and required credentials for supporting systems.</p>
      </td>
      <td>
        <p>The chosen location should be locked down so that only the Environment Manager Master IAM role has access to read contents.</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>Dynamo DB</p>
      </td>
      <td>
        <p>Stores infrastructure configuration and Environment Manager settings/state.</p>
      </td>
      <td>
        <p>Tables should be locked down to prevent access that bypasses the Environment Manager Master IAM role. This avoids invalid or misconfigured data causing unexpected issues.</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>Lambda Backup Script</p>
      </td>
      <td>
        <p>Runs nightly to backup infrastructure configuration from Dynamo DB tables</p>
      </td>
      <td>
        <p>Calls Environment Manager export APIs and stores JSON files in specified location in S3.</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>S3 Backup</p>
      </td>
      <td>
        <p>A bucket or path for holding Environment Manager data backup files.</p>
      </td>
      <td>
        <p>Protects against accidental changes to databases. Can call Import APIs to restore backed up files.</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>Lambda Change Audit Script</p>
      </td>
      <td>
        <p>Listens to Dynamo Streams for all configuration tables and maintains an audit record of changes in separate Dynamo table.</p>
      </td>
      <td>
        <p>Used for tracking who changed what and rolling back unwanted changes.</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>Lambda Dynamo Replication Script</p>
      </td>
      <td>
        <p>At present, most Dynamo tables are duplicated into each Child account to store account and environment specific data.</p>
        <p>&nbsp;</p>
        <p>Some tables contain information that applies to all Environments (e.g. the list of available Services). This Lambda function propagates common data and keeps it in sync across the Child accounts.</p>
      </td>
      <td>
        <p>Coming soon Child Accounts will no longer require their own Dynamo tables. Once this change is complete, this script will be retired.</p>
      </td>
    </tr>
    <tr>
      <td>
        <p>Lambda Instance Scheduling Script</p>
      </td>
      <td>
        <p>Environment Manager allows schedules to be set against Environments or particular ASGs. This Lambda function enforces and applies these schedules within AWS.</p>
      </td>
      <td>
        <p>A separate version of this script runs in each AWS Account.</p>
      </td>
    </tr>
  </tbody>
</table>

[Next (Child Accounts) >](/environment-manager/docs/app-setup/child-accounts)