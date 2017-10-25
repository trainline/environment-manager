# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Unreleased

### Fixed

- Fixed a bug in the deployments screen where $http requests were not being cancelled properly if the request did not complete and the filter was changed. Incorrect results were being displayed.

## [6.9.0] 2017-09-26

### Fixed

- The API was allowing a deployment with a configuration that had already been used to be deployed again. This was causing the deployment to never finish. The API now checks your provided configuration against service deployments that have been carried out already for that version. [#343]
- Logging for cache reset was causing server errors due to not having access to a user object. This has been resolved. [#344]

### Added
- Toggle APIs now support the ability to explicitly set the desired state of an upstream or service [#342]

## [Released]

## [6.8.0] 2017-09-25

### Added
- When a user logs in to Environment Manager and the they have not seen this release before, they will be presented with a notification and a link to the release notes. [#337]
- The 'healthy' check mark was confusing to users. The check mark would show up while there were various other 'warnings' on that same instance. To show what that green check mark actually means, a tooltip has been added to explain. [#338]
- Logging around cache resetting has been improved on the server side. [#340]

### Fixed

- Faulty permissions challenge on service status toggling operations

### Changed

- Instances can now terminate without the 10 minute wait period. [#336]

## [6.7.0] 2017-09-21

### Added
- A filter control has been added to the Environments page [#331]
- A filter for Alert Notifcations. [#329]
- A delete button has been added to the Servers page in the Web Client. [#333]

### Fixed
- You can no longer delete an upstream that is in use by NGINX. The upstream will be tagged so that it 'can' be deleted at a later date. Enough time is given for Puppet to inform NGINX of upstream updates, after that time, upstreams marked for delete will be removed. Note: You are still prohibited from deleting an upstream that is in use by an Environment Manager Load Balancer configuration. [#330]

### Changed
- Dialogues which shows the services installed on instances were showing 'missing' when the instance was in an 'in progress' state for deployment. This was causing confusion. No, if the instance is in an 'in progress' state, you are told that, rather than a 'missing' message for your services. [#334]
- ASG dialogue did not handle having 0 services in a graceful way. Now if there are no services to link to, there is no link. [#332]
- Tables in the Web Client have all been changed to style with stripes. [#329]

## [6.6.0] 2017-09-13

### Added
- Cache Reset button in the settings page of an environment. [#324]
- New Relic Insights field added to Monitoring section of Service settings page. [#326] 
- "Tags" available in Service settings page. Key value pairs can now be added to any service. [#322]
- "1P" check box added to Service settings page. [#322]
]
### Fixed
- Extend ELK link max length to 2048. [#323]

### Changed
- "New Relic" field in Service settings page changed to "New Relic APM link". [#326]
- Allow users to disable services deployed prior to 01.2017. [#327]
- Dependencies on the Service settings page not limited to a drop down of services. [#321]

## [6.5.1] 2017-09-11

### Fixed
- Set the blue and green port numbers in the consul kv store for use by the deployment agent.

## [6.5.0] - 2017-09-07

### Added
- Notifications can be sent to the ContactEmail tag of the instance [#395]

### Fixed
- Times New Roman Font on Servers screen
- Throws a 404 instead of 500 when resources required for authorization are no found. [#385]

## [6.4.1] - 2017-08-29

### Changed
- Load balancer settings validation implemented using [JSON schema](http://json-schema.org/). [#319]

### Fixed
- Fix bad function name introduced [in #318](https://github.com/trainline/environment-manager/pull/318/commits/6d4438e9a3b4bdf72acf585af168e22331526a96#diff-6752f398f8c4161aeb1830026b8b8b98R15).

## [6.4.0] - 2017-08-29 [YANKED]

### Added
- A user can change the owner of a service. [#318]

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
- _Transitioning Server Roles_ section at the top of the servers page highlighting auto scaling groups that are changing size. [#311]
- _Deployments_ column on the servers page highlighting auto scaling groups with deployments in progress. [#311]

### Changed
- Locking an environment prevents modifications to auto scaling groups. [#310]

### Fixed
- Missing dependencies in package produced on Travis CI. [#308]
- Notifications sent before operations completed. [#309]

## [6.0.2] - 2017-08-18

### Added
- POST data to notification event raised by POST /config/upstreams. [#307]

### Removed
- Optional _slice_ parameter from endpoint POST /package-upload-url/{service}/{version}/{environment}.

### Fixed
- The body of the notification event raised by PUT /config/upstreams/{name} was not stringified. [#307]
- A number of bugs related to the removal of a master account as a special case of an account. [#305]

[Unreleased]: https://github.com/trainline/environment-manager/compare/v6.9.0...HEAD
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

[#323]: https://github.com/trainline/environment-manager/pull/323
[#319]: https://github.com/trainline/environment-manager/pull/319
[#318]: https://github.com/trainline/environment-manager/pull/318
[#311]: https://github.com/trainline/environment-manager/pull/311
[#310]: https://github.com/trainline/environment-manager/pull/310
[#309]: https://github.com/trainline/environment-manager/pull/309
[#308]: https://github.com/trainline/environment-manager/pull/308
[#307]: https://github.com/trainline/environment-manager/pull/307
[#305]: https://github.com/trainline/environment-manager/pull/305
[#324]: https://github.com/trainline/environment-manager/pull/324
[#326]: https://github.com/trainline/environment-manager/pull/326
[#322]: https://github.com/trainline/environment-manager/pull/322
[#327]: https://github.com/trainline/environment-manager/pull/327
[#321]: https://github.com/trainline/environment-manager/pull/321
[#334]: https://github.com/trainline/environment-manager/pull/334
[#331]: https://github.com/trainline/environment-manager/pull/331
[#332]: https://github.com/trainline/environment-manager/pull/332
[#330]: https://github.com/trainline/environment-manager/pull/330
[#329]: https://github.com/trainline/environment-manager/pull/329
[#333]: https://github.com/trainline/environment-manager/pull/333
[#337]: https://github.com/trainline/environment-manager/pull/337
[#338]: https://github.com/trainline/environment-manager/pull/338
[#336]: https://github.com/trainline/environment-manager/pull/336
[#340]: https://github.com/trainline/environment-manager/pull/340
[#342]: https://github.com/trainline/environment-manager/pull/342
[#343]: https://github.com/trainline/environment-manager/pull/343
[#344]: https://github.com/trainline/environment-manager/pull/344
