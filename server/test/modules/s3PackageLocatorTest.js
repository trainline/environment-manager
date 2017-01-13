/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

/* eslint func-names: 0, import/no-extraneous-dependencies: 0, prefer-arrow-callback: 0 */

'use strict';

const proxyquire = require('proxyquire').noCallThru();
const should = require('should');

describe('S3 Package Locator', function () {
    let sut;
    before(function () {
        sut = proxyquire('modules/s3PackageLocator', {
            config: {
                get: x => x,
            }
        })
    })

    describe('when I get the S3 put location', function () {
        let testCases = [
            {
                arg: { service: 'my-service', version: '0.0.1-alpha1' },
                result: {
                    Bucket: 'EM_PACKAGES_BUCKET',
                    Key: 'EM_PACKAGES_KEY_PREFIX/my-service/0.0.1-alpha1/my-service-0.0.1-alpha1.zip',
                }
            },
            {
                arg: { environment: 'my-env', service: 'my-service', version: '0.0.1-alpha1' },
                result: {
                    Bucket: 'EM_PACKAGES_BUCKET',
                    Key: 'EM_PACKAGES_KEY_PREFIX/my-service/0.0.1-alpha1/my-env/my-service-0.0.1-alpha1-my-env.zip',
                }
            },
        ]
        testCases.forEach(function (testCase) {
            context(`for package ${JSON.stringify(testCase.arg)}`, function () {
                it(`I get ${JSON.stringify(testCase.result)}`, function () {
                    sut.s3PutLocation(testCase.arg).should.eql(testCase.result);
                });
            });
        });
    });

    describe('when I get the S3 get locations', function () {
        let testCases = [
            {
                arg: { environment: 'my-env', service: 'my-service', version: '0.0.1-alpha1' },
                result: [
                    {
                        Bucket: 'EM_PACKAGES_BUCKET',
                        Key: 'EM_PACKAGES_KEY_PREFIX/my-service/0.0.1-alpha1/my-env/my-service-0.0.1-alpha1-my-env.zip',
                    },
                    {
                        Bucket: 'EM_PACKAGES_BUCKET',
                        Key: 'EM_PACKAGES_KEY_PREFIX/my-service/0.0.1-alpha1/my-service-0.0.1-alpha1.zip',
                    },
                ]
            },
        ]
        testCases.forEach(function (testCase) {
            context(`for package ${JSON.stringify(testCase.arg)}`, function () {
                it(`I get ${JSON.stringify(testCase.result)}`, function () {
                    sut.s3GetLocations(testCase.arg).should.eql(testCase.result);
                });
            });
        });
    });
});
