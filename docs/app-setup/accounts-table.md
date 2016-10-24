---
title: Accounts Table
layout: docs
weight: 11
---

Child AWS accounts can always be added through Environment Managers configuration UI, but the master AWS account is required for the application to start. Without it, Environment Manager has no concept of the environments it manages.

To configure the master AWS account:

1. Complete the [CloudFormation](/environment-manager/docs/app-setup/cloud-formation) step to ensure your DynamoDB tables have been created.
1. Login to the AWS Management Console for the account you wish to use as the master Account.
1. Locate the _InfraConfigAccounts_ DynamoDB table - it will still be empty at this point. 
1. Create a new item in the table wit the following attributes:

```
AccountName: <ALIAS_NAME>  
AccountNumber: <AWS_ACCOUNT_NUMBER>  
Impersonate: false  
IsMaster: true  
IsProd: true  
```

The `<ALIAS_NAME>` can be any human-friendly alias you want to give the master account.  

The `<AWS_ACCOUNT_NUMBER>` value should be the 12 digit account number of the account you are currently logged in to.

The other attributes should be given boolean values as shown.

[Next (Configuration File) >](/environment-manager/docs/app-setup/config-file)
