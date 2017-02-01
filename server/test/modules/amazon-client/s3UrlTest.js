/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

/* eslint func-names: 0, import/no-extraneous-dependencies: 0, prefer-arrow-callback: 0 */

'use strict';

const should = require('should');
const sut = require('modules/amazon-client/s3Url');

describe('s3Url', function() {
    describe('when I parse', function() {
        let bucket = 'BUCKET';
        let endpoint = 'https://s3-eu-west-1.amazonaws.com';
        let key = 'key.txt';
        let versionId = '/0arxd';
        let objectUrls = [
            'https://s3-eu-west-1.amazonaws.com/BUCKET/key.txt',
            'https://BUCKET.s3-eu-west-1.amazonaws.com/key.txt',
        ];
        let objectVersionUrls = objectUrls.map(url => `${url}?versionId=${versionId}`);

        objectUrls.forEach(function(url) {
            context(`the valid object url ${url}`, function() {
                let result;
                before(function() {
                    result = sut.parse(url);
                });
                it(`the endpoint is ${endpoint}`, function() {
                    result.should.have.property('endpoint').eql(endpoint);
                });
                it(`the bucket is ${bucket}`, function() {
                    result.should.have.property('Bucket').eql(bucket);
                });
                it(`the key is ${key}`, function() {
                    result.should.have.property('Key').eql(key);
                });
                it('the versionId is undefined', function() {
                    result.should.have.property('VersionId').undefined();
                });
            });
        });

        objectVersionUrls.forEach(function(url) {
            context(`the valid object url ${url}`, function() {
                let result;
                before(function() {
                    result = sut.parse(url);
                });
                it(`the endpoint is ${endpoint}`, function() {
                    result.should.have.property('endpoint').eql(endpoint);
                });
                it(`the bucket is ${bucket}`, function() {
                    result.should.have.property('Bucket').eql(bucket);
                });
                it(`the key is ${key}`, function() {
                    result.should.have.property('Key').eql(key);
                });
                it(`the versionId is ${versionId}`, function() {
                    result.should.have.property('VersionId').eql(versionId);
                });
            });
        });

        context('an invalid object url the result is undefined', function() {
            let inputs = [
                'https://s3-eu-west-1.amazonaws.com',
                'https://s3-eu-west-1.amazonaws.com/',
                'https://s3-eu-west-1.amazonaws.com/bucket',
                'https://s3-eu-west-1.amazonaws.com/bucket/',
                'https://s3-eu-west-1.amazonaws.com/bucket?versionId=a',
                'https://s3-eu-west-1.amazonaws.com/bucket/key?versionId=',
                'https://xs3-eu-west-1.amazonaws.com/bucket/key',
                'https://a.b.s3-eu-west-1.amazonaws.com/bucket/key',
                'https://bucket.s3-eu-west-1.amazonaws.com/',
            ];
            inputs.forEach(function(input) {
                it(input, function() {
                    should(sut.parse(input)).be.undefined();
                });
            });
        });
    });

    describe('when I format', function() {
        let region = 'eu-west-1';
        let testCases = [
            {
                arg: { Bucket: 'BUCKET', Key: 'path/file.txt' },
                result: 'https://s3-eu-west-1.amazonaws.com/BUCKET/path/file.txt'
            },
            {
                arg: { Bucket: 'BUCKET', Key: 'path/file.txt', VersionId: 'my-version' },
                result: 'https://s3-eu-west-1.amazonaws.com/BUCKET/path/file.txt?versionId=my-version'
            },
        ]

        testCases.forEach(function(testCase) {
            context(JSON.stringify(testCase.arg), function() {
                it(`I get ${testCase.result}`, function() {
                    sut.format(testCase.arg, region).should.eql(testCase.result);
                });
            });
        });
    });
});

