# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Extend ELK link max length to 2048. [#323]

## [6.5.1]

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

[Unreleased]: https://github.com/trainline/environment-manager/compare/v6.5.1...HEAD
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