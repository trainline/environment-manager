# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).
This project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/trainline/environment-manager/compare/v6.1.0...HEAD
[6.1.0]: https://github.com/trainline/environment-manager/compare/6.0.2...v6.1.0
[6.0.2]: https://github.com/trainline/environment-manager/compare/6.0.1...6.0.2

[#311]: https://github.com/trainline/environment-manager/pull/311
[#310]: https://github.com/trainline/environment-manager/pull/310
[#309]: https://github.com/trainline/environment-manager/pull/309
[#308]: https://github.com/trainline/environment-manager/pull/308
[#307]: https://github.com/trainline/environment-manager/pull/307
[#305]: https://github.com/trainline/environment-manager/pull/305