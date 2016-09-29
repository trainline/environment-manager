---
title: Environment Manager API
layout: docs
weight: 20
---

Everything that can be done through the website can also be done programmatically using Environment Manager’s APIs.

Swagger documentation for the APIs can be found by visiting the /docs endpoint of your installation location.

To call any API, it is first necessary to obtain a security token that can be used to authorise and audit the actions taken.

### Getting a Token

Tokens are issued by calling the /api/token endpoint and passing appropriate Active Directory credentials.
Post the following parameters in url-encoded format:

-	grant_type: Only currently supported is password.
-	username: Account domain and username
-	password: Account password

For example:

```
curl -Uri https://environmentmanager.your.local.domain/api/token 
     -Method POST 
     -Body "grant_type=password&username={your.local.domain\user_name}&password={user_password}"
```

This API returns a plain text bearer token that contains encrypted user and permission data based on Active Directory group membership.

Note: Tokens automatically expire after 5 minutes so should be obtained immediately before calling Environment Manager APIs.

### Using the Token

Apart from /api/token, all other APIs expect a token to be passed as an Authorization header. For example:

```
curl -Uri https://environmentmanager.your.local.domain/api/accounts
     -Headers @{"Authorization" = "Bearer {issued_token}"}
```
