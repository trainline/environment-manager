# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

[Unreleased]

### Fixed

- The "Nodes Deployed" value on the details of a deployment now show you the `total deployed / total nodes`. Total nodes was previously incorrect, it would show you a value that ended up with odd results like `10/1` for Nodes Deployed. This was confusing because it was nonsense. If 10 instances have completed, you will now see `10/10` for all the nodes.

- Switched to at-most-once delivery of Deployment Completed notifications by ensuring only one deployment monitor is running at any given time. This also reduces the load on the AWS APIs.

### Added

- You can not terminate an instance directly and not have to scale up then down. If you want a new instance to remove one with missing services, or any other reason, you can. The ASG screen contains a `terminate` button that is available to all instances that are `In Service` and `Running`. When you terminate an instance, your ASG will delete that instance and replace it with another to meet the desired count of that ASG. Please note that to change the count of machines in your ASG, you will need to change the desired count. You cannot reduce the number of machines in your ASG by terminating instances one by one. 

## [6.20.1] 2018-02-27

### Changed

- Server view now shows an ordered list of ASGs beginning with ASGs in Error state, then Warning, Not Running and finally Healthy.

- Improved logging for deployments. The deployment details modal now shows the log in time order ascending (like a normal log!). A link has been added to this screen to the `deployment-support` Slack channel. When the deployment is now in the hands of the Consul Deployment Agent (CDA), the UI will show information on what that _means_. There are lots of things that could happen that are now outside the control of Environment Manager which could result in a failed or hanging deployment - until we automate those checks, we can at least show a list of what the common causes are. Some of the entries within the log have been changed to be more reflective of the operation being performed.

- Improved 'Get Available Ports' operation for new Services.

### Added 

- A selection of a team is now persisted through the use of Environment Manager. This is kept between screens and also between new browser windows on the same machine. From now on, if you tell Environment Manager you want to be looking at 'my team', you will be looking at that team constantly until you change that selection. 

- A selection of an environment is now persisted through the use of Environment Manager. This is kept between screens and also between new browser windows on the same machine. From now on, if you tell Environment Manager you want to be looking at 'my environment', you will be looking at that environment constantly until you change that selection. 

- Raises SNS events when deployments complete.

## [6.19.0] 2018-02-14

### Changed

- Calls made from the server screen and asg modal are now running through the ec2 client which queries the _new_ EC2monitor. 

- Servers screen no longer shows deployment status.

### Added

- A new "user settings" modal has been added to the UI. At the moment, it is only used to filter by default, your environment list on the main screen. Now you can add a comma separated list of the environments you want to see. A toggle has also been added to give you the full list if you want that back, or you can remove/not use the environments filter list. 

### Fixed

- Removed environment schedule cache to prevent scheduling race conditions. 

- When a user performs an HTTP request that results in an error which contains no details, the resulting dialog shows "ERROR" and nothing to help the user identify the cause of the issue. Now, any response that doesn't contain any details, the error modal will be given some useful http request information to display that resulted in the error screen. 

- Improved error handling 

## [6.17.0] 2018-01-25

- Added environment type to scheduled actions endpoint

## [6.15.4] 2018-01-24

### Fixed

- Fix Operations > New Instaces, where results were not being returned to the caller. 

## [6.15.3] 2017-12-16

### Fixed

- Fix error preventing ASGs from being deleted. 

## [6.15.2] 2017-12-14

### Fixed

- When instances are in standby and do not receive the latest version, the API endpoint <api>/services/<serviceName> was returning old version numbers of instances that are no longer in AWS, but remain in that Consul cluster. This is not what people want to see. The end point will now find the latest version of that service deployed in that environment to show the latest version in the results. 

## [6.14.2] - 2017-12-07

### Added

- Allow ASG owners to change the amount of time an instance is kept alive after termination has begun.

### Fixed

- Build issues

## [6.13.0] - 2017-11-30

### Changed

- Cache reset functionality for an environment will not perform 2 actions: ["send http post to reset cache of each node", "update consul for that environment with a cache time stamp value in the KV store"]. The existing http requests can be used for any service which is reachable via http requests based on the consul node ip. The cache timestamp value can be listened to by services running in Cluster mode with PM2, and each cluster service can respond to the request for a cache reset that way. 

## [6.12.5] - 2017-11-27

### Fixed

- Deployment Map Targets were failing in the UI. A recent change to this UI component has been reverted, allowing the server role changes to save correctly. 

## [6.12.4] - 2017-11-27

### Fixed

- Days out of date for an AMI is now the number of days between the release of the following stable AMI and today. 
- An upstream in the _common_ environment type is valid in the settings for any load balancer. 

### Changed

- Min and max auto scaling group size are no longer required by the */asgs/{name}/scaling-schedule*. They now default to the desired size. 

## [6.12.1] - 2017-11-16

### Fixed

- Fixed error in maintenance mode feature

### Changed

- If an upstream exists, that is not enough for it to be valid. The upstream needs to exist against an environment type that matches the environment type of the load balancer setting. 

## [6.12.0] - 2017-11-09

### Added

- C5 instance type options for EC2 instances 

### Fixed

- The "set auto scaling group size" feature

## [6.11.5] - 2017-11-03

### Fixed

- Create new Service screen was showing broken service name field 

## [6.11.4] - 2017-10-31

### Fixed

- Regression causing the scheduled scaling API to fail

## [6.11.3] - 2017-10-30

### Fixed

- Bug causing some API calls to throw

## [6.11.2] - 2017-10-30

### Changed

- ProxyPass rules in the Load Balancer settings of the UI now allow you to add a variable as the value. The upstream value doesn't have to exist in order to be considered valid as long as there is a matching key in the `Set` list. 

Example:
    {
        "Set": ["$anything-you-want value"]
        "ProxyPass": "https://$anything-you-want"
    }



## [6.11.1] - 2017-10-24

### Fixed

- Custom rules for load balancer settings editor. Prevents non existing upstreams being added. 
- Mark for delete removed pending TTL settings change in AWS. 

## [6.11.0] - 2017-10-19

### Added

- Scheduled scaling visualisation 

### Changed

- Made ASG scaling tab a little more intuitive 

### Fixed

- Schedule visualisation bugs 

## [6.10.0] - 2017-10-17

### Added

- Schedule visualisation in editor 

## [6.9.15] - 2017-10-16

### Fixed

- Issue causing EM to crash periodically (Removed environment sync feature) 

## [6.9.12] - 2017-10-13

### Changed

- SHA256 has been removed from the authentication module. 

## [6.9.11]

### Changed

- Cache reset now sends a request to every node, rather than a single matching node for a service. 

## [6.9.9]

### Added

- Cache reset request now displays all results of the calls it made within the UI. 

### Changed

- Removed package path from deployment UI 
- Deprecated the package location property from deployment API 

## [6.9.6] 2017-10-06

### Added
- APIs for synchronising service versions across environments 
    - POST /environment/{environment}/sync-services/jobs
    - GET /environment/{environment}/sync-services/job/{JobId}

### Changed
- Use of `MD5` hashing has been replaced with `SHA256`. 
- Use of `uuidv1` within user authentication has been replaced with `uuidv4`. 

### Fixed

- HTML classes moved within the span element which were outside the span as plain text. 

## [6.9.5] 2017-10-02

### Changed

- There was a check in place for deployments that have been carried out already for the version you are requesting. This check has now been removed, allowing you to deploy the same version again. 

## [6.9.4] 2017-09-29

### Added

- The ability to delete a service (can be restored when services are mistakenly deleted) 

### Changed

- Deprecated GET and DELETE /config/services/{name}/{cluster} endpoints. See API docs.

### Fixed

- Environment Manager Sensu Alerts for Node
- [Truncation of service version identifiers at 50 characters in the UI](https://gitlab.tools.trainline.eu/capitainetrain/mweb/issues/487). Service version identifiers now limited to 100 characters in UI and API. User notified if a longer version identifier is pasted into UI. 

### Fixed

- Fixed a bug in the deployments screen where $http requests were not being cancelled properly if the request did not complete and the filter was changed. Incorrect results were being displayed.

## [6.9.0] 2017-09-26

### Fixed

- The API was allowing a deployment with a configuration that had already been used to be deployed again. This was causing the deployment to never finish. The API now checks your provided configuration against service deployments that have been carried out already for that version. 
- Logging for cache reset was causing server errors due to not having access to a user object. This has been resolved. 

### Added
- Toggle APIs now support the ability to explicitly set the desired state of an upstream or service 

## [6.8.0] 2017-09-25

### Added
- When a user logs in to Environment Manager and the they have not seen this release before, they will be presented with a notification and a link to the release notes. 
- The 'healthy' check mark was confusing to users. The check mark would show up while there were various other 'warnings' on that same instance. To show what that green check mark actually means, a tooltip has been added to explain. 
- Logging around cache resetting has been improved on the server side. 

### Fixed

- Faulty permissions challenge on service status toggling operations

### Changed

- Instances can now terminate without the 10 minute wait period. 

## [6.7.0] 2017-09-21

### Added
- A filter control has been added to the Environments page 
- A filter for Alert Notifcations. 
- A delete button has been added to the Servers page in the Web Client. 

### Fixed
- You can no longer delete an upstream that is in use by NGINX. The upstream will be tagged so that it 'can' be deleted at a later date. Enough time is given for Puppet to inform NGINX of upstream updates, after that time, upstreams marked for delete will be removed. Note: You are still prohibited from deleting an upstream that is in use by an Environment Manager Load Balancer configuration. 

### Changed
- Dialogues which shows the services installed on instances were showing 'missing' when the instance was in an 'in progress' state for deployment. This was causing confusion. No, if the instance is in an 'in progress' state, you are told that, rather than a 'missing' message for your services. 
- ASG dialogue did not handle having 0 services in a graceful way. Now if there are no services to link to, there is no link. 
- Tables in the Web Client have all been changed to style with stripes. 

## [6.6.0] 2017-09-13

### Added
- Cache Reset button in the settings page of an environment. 
- New Relic Insights field added to Monitoring section of Service settings page.  
- "Tags" available in Service settings page. Key value pairs can now be added to any service. 
- "1P" check box added to Service settings page. 
]
### Fixed
- Extend ELK link max length to 2048. 

### Changed
- "New Relic" field in Service settings page changed to "New Relic APM link". 
- Allow users to disable services deployed prior to 01.2017. 
- Dependencies on the Service settings page not limited to a drop down of services. 

## [6.5.1] 2017-09-11

### Fixed
- Set the blue and green port numbers in the consul kv store for use by the deployment agent.

## [6.5.0] - 2017-09-07

### Added
- Notifications can be sent to the ContactEmail tag of the instance 

### Fixed
- Times New Roman Font on Servers screen
- Throws a 404 instead of 500 when resources required for authorization are no found. 

## [6.4.1] - 2017-08-29

### Changed
- Load balancer settings validation implemented using [JSON schema](http://json-schema.org/). 

### Fixed
- Fix bad function name introduced [in #318](https://github.com/trainline/environment-manager/pull/318/commits/6d4438e9a3b4bdf72acf585af168e22331526a96#diff-6752f398f8c4161aeb1830026b8b8b98R15).

## [6.4.0] - 2017-08-29 [YANKED]

### Added
- A user can change the owner of a service. 

## [6.3.0] - 2017-08-25

### Added
- Added CustomErrorCodes and CacheTime LB Settings

## [6.2.0] - 2017-08-25

### Changed
- 'config/services' page layout logically grouped
- 'config/services' page now contains fields for "new relic", "elk", "jira" and "wiki" links.
- 'config/services' primary contact pattern no longer validates on only alphanumeric characters. Email addresses are permissible.
- 'config/services' primary contact now provides a button to allow you to obtain the owning teams email address, if one exists and to use that as the primary contact details.
- 'config/services' page now allow you to list dependencies of your service. This field contains a typeahead for services in the same environment while you can also just add free text if you choose to.

## [6.1.1] - 2017-08-23

### Fixed
- Resolved missing UI dependencies.

## [6.1.1] - 2017-08-23

### Fixed
- JavaScript and CSS files added to accessible location for angular-loading-bar and angular-smart-table.

## [6.1.0] - 2017-08-23

### Added
- _Transitioning Server Roles_ section at the top of the servers page highlighting auto scaling groups that are changing size. 
- _Deployments_ column on the servers page highlighting auto scaling groups with deployments in progress. 

### Changed
- Locking an environment prevents modifications to auto scaling groups. 

### Fixed
- Missing dependencies in package produced on Travis CI. 
- Notifications sent before operations completed. 

## [6.0.2] - 2017-08-18

### Added
- POST data to notification event raised by POST /config/upstreams. 

### Removed
- Optional _slice_ parameter from endpoint POST /package-upload-url/{service}/{version}/{environment}.

### Fixed
- The body of the notification event raised by PUT /config/upstreams/{name} was not stringified. 
- A number of bugs related to the removal of a account as a special case of an account. 

[Unreleased]: https://github.com/trainline/environment-manager/compare/6.20.1...master
[6.20.1]: https://github.com/trainline/environment-manager/compare/6.19.0...6.20.1
[6.19.0]: https://github.com/trainline/environment-manager/compare/6.17.0...6.19.0
[6.17.0]: https://github.com/trainline/environment-manager/compare/6.15.4...6.17.0
[6.15.4]: https://github.com/trainline/environment-manager/compare/6.15.3...6.15.4
[6.15.3]: https://github.com/trainline/environment-manager/compare/6.15.2...6.15.3
[6.15.2]: https://github.com/trainline/environment-manager/compare/6.14.2...6.15.2
[6.14.2]: https://github.com/trainline/environment-manager/compare/6.13.0...6.14.2
[6.13.0]: https://github.com/trainline/environment-manager/compare/6.12.5...6.13.0
[6.12.5]: https://github.com/trainline/environment-manager/compare/6.12.4...6.12.5
[6.12.4]: https://github.com/trainline/environment-manager/compare/6.12.1...6.12.4
[6.12.1]: https://github.com/trainline/environment-manager/compare/6.12.0...6.12.1
[6.12.0]: https://github.com/trainline/environment-manager/compare/6.11.5...6.12.0
[6.11.5]: https://github.com/trainline/environment-manager/compare/6.11.4...6.11.5
[6.11.4]: https://github.com/trainline/environment-manager/compare/6.11.3...6.11.4
[6.11.3]: https://github.com/trainline/environment-manager/compare/6.11.2...6.11.3
[6.11.2]: https://github.com/trainline/environment-manager/compare/6.11.1...6.11.2
[6.11.1]: https://github.com/trainline/environment-manager/compare/6.11.0...6.11.1
[6.11.0]: https://github.com/trainline/environment-manager/compare/6.10.0...6.11.0
[6.10.0]: https://github.com/trainline/environment-manager/compare/6.9.15...6.10.0
[6.9.15]: https://github.com/trainline/environment-manager/compare/v6.9.12...6.9.15
[6.9.12]: https://github.com/trainline/environment-manager/compare/6.9.11...v6.9.12
[6.9.10]: https://github.com/trainline/environment-manager/compare/6.9.9...v6.9.11
[6.9.7]: https://github.com/trainline/environment-manager/compare/6.9.6...v6.9.9
[6.9.6]: https://github.com/trainline/environment-manager/compare/6.9.5...v6.9.6
[6.9.5]: https://github.com/trainline/environment-manager/compare/v6.9.4...6.9.5
[6.9.4]: https://github.com/trainline/environment-manager/compare/v6.9.0...v6.9.4
[6.9.0]: https://github.com/trainline/environment-manager/compare/v6.8.0...v6.9.0
[6.8.0]: https://github.com/trainline/environment-manager/compare/v6.7.0...v6.8.0
[6.5.1]: https://github.com/trainline/environment-manager/compare/v6.5.0...v6.5.1
[6.5.0]: https://github.com/trainline/environment-manager/compare/v6.4.1...v6.5.0
[6.4.1]: https://github.com/trainline/environment-manager/compare/6.4.0...v6.4.1
[6.4.0]: https://github.com/trainline/environment-manager/compare/6.3.0...v6.4.0
[6.3.0]: https://github.com/trainline/environment-manager/compare/6.2.0...6.3.0
[6.2.0]: https://github.com/trainline/environment-manager/compare/v6.1.0...6.2.0
[6.1.0]: https://github.com/trainline/environment-manager/compare/6.0.2...v6.1.0
[6.0.2]: https://github.com/trainline/environment-manager/compare/6.0.1...6.0.2