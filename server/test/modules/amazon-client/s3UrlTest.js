/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

/* eslint func-names: 0, import/no-extraneous-dependencies: 0, prefer-arrow-callback: 0 */
'use strict';

const should = require('should');
const sut = require('modules/amazon-client/s3Url');

describe('s3Url', function () {
  describe('when I parse', function () {
    context('a valid object url', function () {
      let endpoint = 'https://s3-eu-west-1.amazonaws.com';
      let bucket = 'myBucket';
      let key = 'path/to/my/key.txt';
      let input = `${endpoint}/${bucket}/${key}`;
      let result;
      before(function () {
        result = sut.parse(input);
      });
      it('the endpoint is correct', function () {
        result.should.have.property('endpoint').eql(endpoint);
      });
      it('the bucket is correct', function () {
        result.should.have.property('Bucket').eql(bucket);
      });
      it('the key is correct', function () {
        result.should.have.property('Key').eql(key);
      });
      it('the versionId is undefined', function () {
        result.should.have.property('VersionId').undefined();
      });
    });
    context('a valid object version url', function () {
      let endpoint = 'https://s3-eu-west-1.amazonaws.com';
      let bucket = 'myBucket';
      let key = 'path/to/my/key.txt';
      let versionId = '/0arxd';
      let input = `${endpoint}/${bucket}/${key}?versionId=${versionId}`;
      let result;
      before(function () {
        result = sut.parse(input);
      });
      it('the endpoint is correct', function () {
        result.should.have.property('endpoint').eql(endpoint);
      });
      it('the bucket is correct', function () {
        result.should.have.property('Bucket').eql(bucket);
      });
      it('the key is correct', function () {
        result.should.have.property('Key').eql(key);
      });
      it('the versionId is correct', function () {
        result.should.have.property('VersionId').eql(versionId);
      });
    });
    context('an invalid object url the result is undefined', function () {
      let inputs = [
        'https://s3-eu-west-1.amazonaws.com',
        'https://s3-eu-west-1.amazonaws.com/',
        'https://s3-eu-west-1.amazonaws.com/bucket',
        'https://s3-eu-west-1.amazonaws.com/bucket/',
        'https://s3-eu-west-1.amazonaws.com/bucket?versionId=a',
        'https://s3-eu-west-1.amazonaws.com/bucket/key?versionId=',
        'https://xs3-eu-west-1.amazonaws.com/bucket/key',
      ];
      for (let input of inputs) {
        it(input, function () {
          should(sut.parse(input)).be.undefined();
        });
      }
    });
  });
});
