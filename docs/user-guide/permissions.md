---
title: User Permissions
layout: docs
weight: 15
---

Environment Manager allows you to authorize different users to perform different activities or functions based on their needs and responsibilities. Note that authorization largely applies to destructive operations such as creating and updating resources. Generally all authenticated Environment Manager users have read-only access within the system.

### Resources

The functions of Environment Manager are designed around the idea of manipulating resources. There are several types of resources such as environments, services, deployment maps, upstreams and so on. For example the "UAT1" environment is an example of a resource, in this case a User Acceptance Test Environment. The "Service1" service is another example of a resource. Authorization in environment manager is based on the idea of assigning users with permissions to manipulate these resources in different ways.

Each resource has a path just like files and urls do. Using paths is the mechanism by which we reference a particular resource. The path for the configuration of Service1 looks like this: /config/services/service1. Paths are case insensitive.

### Resource Permissions

Resource Permissions are assigned to users in order to authorize them to manipulate a resource. You can assign any number of resource permissions to a user and therefore authorize them to manipulate any number of resources. A resource permission has two properties:

- Resource: A pattern which matches the path to the resource in question.
- Access: The kind of manipulation that the user is allowed to perform on the resource.

Note: Some authorization systems allow you to specifically deny access to a particular resource, however Environment Manager currently does not. Each new permission assigned grants the user more access, never less.

### Access

The Access property of a permission must be one of the following values:

- POST: Allows the user to create the resource.
- PUT: Allows the user to modify an existing resource.
- DELETE: Allows the user to delete the resource.
- ADMIN: Allows the user to perform all of the above.

Here is an example of a JSON formatted permission which, if assigned to a user, would allow that user to delete service1..

```
{
    "Resource": "/config/services/service1",
    "Access": "DELETE"
}
```

### Resource Path Patterns

The Resource property supports wildcard pattern matching of the path of the resource. The structure of resource paths and the patterns used in permissions is what makes it possible to assign permissions to certain groups of resources without knowing their individual path names.
For example. The following permission grants the user to create new services.

```
{
    "Resource": "/config/services/**",
    "Access": "POST"
}
```

The ** wilcard used in the resource path matches the name of any service, and therefore allows the user to create services with any name they wish. The pattern matching is based on glob patterns such as those used with various file systems. See [Globs](https://en.wikipedia.org/wiki/Glob_(programming)) for more information. We support the following wildcards:

- \* matches any number of non / character
- ** matches any number of characters
- ? maches exactly one non / character
- {a,b} matches either a or b and brackets can be nested

As a final example, this permission gives the user the ability to do anything:

```
{
    "Resource": "**",
    "Access": "ADMIN"
}
```

### Environment Type and Cluster (team) Permissions

Some resources are related to others in particular ways and this has an effect on the way authorization works. For example, environments are related to both environment types, and to clusters. An environment is said to be an instance of a particular environment type and is also owned by a particular cluster. In order to have permissions to modify an environment, a user must also have modify permissions to both that environment type and to the owning cluster.

Below are the permissions that a user would need in order to create or modify a 'production' type environment owned by the 'Example' cluster.

```
[
    { "Resource": "/config/environments/*", "Access": "POST" },
    { "Resource": "/config/environments/*", "Access": "PUT" },
    { "Cluster": "example" },
    { "EnvironmentType": "prod" }
]
```

Notice the cluster and environment type permissions. They are not permissions to resources, but permissions to fulfil the access needed to resources related to those clusters and environment types. The cluster permission above gives the user access to the Example cluster (team). The environment type permission gives the user access to production.

### Environment Type and Cluster Filtered Resource Permissions

Sometimes you will want to provide access to a particular environment type such as production, but only for specific operations. In this case clusters and environment types can be provided as a filter for a resource permission. For example, the following permission gives a Example cluster developer access to production, but only when performing deployments..

```
{ "Resource": "**/deploy**", "Access": "POST", "Clusters": ["Example"], "EnvironmentTypes": ["prod"] }
```

You can set these filters to 'all' to avoid having to list them all. For example I can change the permission above to give an Example cluster developer the ability to deploy in all environment types like this:

```
{ "Resource": "**/deploy**", "Access": "POST", "Clusters": ["Example"], "EnvironmentTypes": "all" }
```

Please note that when using cluster and environment type filters in your resource permissions, you must specify a value for both cluster and environment type if a resource is related to both, otherwise it cannot match.

### Users, Groups and Membership

Although you can assign permissions directly to a user, this isn't particularly helpful when you have a lot of users. Users can be members of groups such as 'developers'. Permissions can be assigned to groups. Therefore if a set of related users are all members of the same group, you can assign those permissions common to those users to the group. All members of that group will inherit those permissions.

Groups can also be members of other groups, and inherit those groups permissions, as do members of that group.

Group membership is controlled by Active Directory, while permissions - which are specific to Environment Manager - are controlled by Environment Manager.

### Managing Permissions

Let's demonstrate how to assign or modify permissions for an Active Directory user or group.

First you should understand that permissions are a secured resource like any other. In order to work with permission sets in Environment Manager, you must already have permission to '/config/permissions/*' resources. If you do not, you will not see the appropriate create, edit and delete controls in the Environment Manager UI.

First use the menu to navigate to Configuration > Users & Groups. You should see a list of all users and groups to which permissions have been assigned. Like this:

![Users and Groups Screen](/environment-manager/assets/images/users-and-groups.png)

### Deleting

You can delete a set of permissions by clicking the delete button on this screen. This does not delete the user or group from Active Directory. It merely removes all permissions assigned to that user in Environment Manager.

### Creating and Modifying

In order to create a new set of permissions click the "Create New..." button at the top of the screen. In order to modify the permissions of an existing user or group, simply click on their name. In both cases a screen similar to the following will appear:

![Create new User Screen](/environment-manager/assets/images/create-new-user.png)

When creating a new set of permissions, you will need to supply a name, and that name will need to match the name of a user or group within Active Directory. When editing an existing set, you will not be able to change the name. Instead, create a new set.

When creating or editing a permission set you must supply a properly formatted JSON array of permissions. The UI will not allow you to save a set until it is valid.
