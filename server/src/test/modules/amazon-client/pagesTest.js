/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

/* eslint func-names: 0, import/no-extraneous-dependencies: 0, prefer-arrow-callback: 0 */

'use strict';

const should = require('should');
const pages = require('../../../modules/amazon-client/pages');

let flatten = pages.flatten;

describe('pages', function () {
    describe('flatten', function () {
        context('when AWS api returns an error', function () {
            it('it returns a rejected promise', function () {
                let awsRequest = {
                    eachPage: (cb) => {
                        cb(null, 1);
                        cb(new Error('some error'));
                    }
                }
                return flatten(x => x, awsRequest).should.be.rejected(/some error/);
            })
        });
        context('when AWS api returns no pages', function () {
            it('it returns a promise of an empty array', function () {
                let awsRequest = {
                    eachPage: (cb) => {
                        cb(null, null);
                    }
                }
                return flatten(x => x, awsRequest).should.finally.eql([]);
            })
        });
        context('when AWS api returns an empty page', function () {
            it('it returns a promise of an empty array', function () {
                let awsRequest = {
                    eachPage: (cb) => {
                        cb(null, []);
                        cb(null, null);
                    }
                }
                return flatten(x => x, awsRequest).should.finally.eql([]);
            })
        });
        context('when AWS api returns a sequence of single-item pages', function () {
            it('it returns a promise of a flat array of the items', function () {
                let awsRequest = {
                    eachPage: (cb) => {
                        cb(null, 1);
                        cb(null, 2);
                        cb(null, null);
                    }
                }
                return flatten(x => x, awsRequest).should.finally.eql([1, 2]);
            })
        });
        context('when AWS api returns a sequence of multi-item pages', function () {
            it('it returns a promise of a flat array of the items', function () {
                let awsRequest = {
                    eachPage: (cb) => {
                        cb(null, [1, 2]);
                        cb(null, [3, 4]);
                        cb(null, null);
                    }
                }
                return flatten(x => x, awsRequest).should.finally.eql([1, 2, 3, 4]);
            })
        });
    });
});
