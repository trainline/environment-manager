---
title: Configuration File
layout: docs
weight: 20
---

The next step is to create the Environment Manager Application Configuration file and upload this to the Configuration S3 bucket/path that was setup earlier.

### Sample Config File

Here is a sample config file you can use to get started..

```
{
  "ActiveDirectory": {
    "url": "ldaps://local.active.directory.server",
    "baseDN": "dc=xxx,dc=yyy",
    "username": "environment-manager-user@local.ad",
    "password": "some-password",
    "secure": true,
    "tlsOptions": {
      "rejectUnauthorized": false
    }
  },
  "authentication": {
    "loginUrl": "/login",
    "cookieName": "environmentmanager",
    "cookieDuration": "12h",
    "tokenDuration": "5m",
    "defaultAdmin": "some-user-or-group-name"
  },
  "nugetRootUrl": "http://your.local.nuget.server/and/path/",
  "content": {
    "links": {
      "LIST_OF_IMAGES": "https://link.to/Available+Images",
      "DYNAMO_CONFIG": "https://link.to/Dynamo+Config",
      "SECURITY_ZONES": "https://link.to/Security+Zones",
      "UPSTREAMS": "https://link.to/Upstreams",
      "LINUX_PUPPET_REPO": "https://link.to/Upstreams"
    }
  },
  "server": {
    "port": 99999,
    "ssl": {
      "S3": {
        "bucket": "name-of-bucket",
        "key": "path/to/private_key.pkcs7.pem",
        "cert": "path/to/public_key.pkcs7.pem"
      }
    }
  }
}
```

### Active Directory

This section describes the settings Environment Manager needs to connect to your LDAP server.

### Authentication

The main part of the authentication section to be aware of is the 'defaultAdmin' setting. This setting represents the name of a user or group. If the permissions table is empty, Environment Manager will create a permissions set for this identity to allow the first user to log in to the system. This user will have complete access to all resources and operations. If this value is not present when Environment Manager first starts, the system will throw an error and not be able to start.

### Server Settings

- Port: This is the port that Environment Manager will run on.
- SSL for S3: Here we set bucket name that will contain our deployable packages, and the certificate used to access this bucket.

### Content

The content links are to documentation / help / guidance / info referenced from the Environment Manager UI and related to your environment. For example, wherever you record your AMI release notes.

[Next (Application Setup) >](/environment-manager/docs/app-setup/em-installation)