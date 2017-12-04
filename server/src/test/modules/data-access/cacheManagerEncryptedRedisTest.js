/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* eslint-env mocha */

'use strict'

require('should');
let emCrypto = require('../../../modules/emCrypto');
let fp = require('lodash/fp');
const inject = require('inject-loader!../../../modules/data-access/cacheManagerEncryptedRedis');
let timers = require('timers');

let silent = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
}

let TTL = 30;
let defaultOptions = {
    host: 'localhost',
    port: 6379,
    readTimeout: 10,
    writeTimeout: 10,
}

describe('encrypted Redis cache manager', function () {
    describe('set then get returns the input unmodified', function () {
        let sut;
        before(function () {
            function fakeRedis() {
                let db = new Map();
                return {
                    on: () => { },
                    del: k => db.delete(k),
                    getBuffer: k => db.get(k),
                    reset: () => db.clear(),
                    setBuffer: (k, v) => db.set(k, v),
                    setexBuffer: (k, ttl, v) => db.set(k, v),
                };
            }

            sut = inject({
                'ioredis': fakeRedis,
                '../logger': silent,
            });
        });

        context('when no encryption transformation is specified', function () {
            let inputs = [null, false, 0, 'A', { a: 'A' }];
            inputs.forEach(input => {
                it(`${input}`, function () {
                    let redis = sut.create(defaultOptions);
                    return redis.set('a', input, { ttl: TTL })
                        .then(() => redis.get('a'))
                        .should.finally.eql(input);
                });
            });
        });
        context('when emCrypto encryption transformation is specified', function () {
            let inputs = [null, false, 0, 'A', { a: 'A' }];
            inputs.forEach(input => {
                it(`${input}`, function () {
                    let password = 'my simple password';
                    let encrypt = fp.flow(JSON.stringify, str => new Buffer(str), emCrypto.encrypt.bind(null, password));
                    let decrypt = fp.flow(emCrypto.decrypt.bind(null, password), buf => buf.toString(), JSON.parse);

                    let options = Object.assign({}, defaultOptions, {
                        valueTransform: {
                            toStore: encrypt,
                            fromStore: decrypt,
                        },
                    });
                    let redis = sut.create(options);
                    return redis.set('a', input, { ttl: TTL })
                        .then(() => redis.get('a'))
                        .should.finally.eql(input);
                });
            });
        });
    });
    describe('when Redis is unavailable', function () {
        let sut;
        before(function () {
            let noresponse = () => new Promise((_, reject) => { timers.setTimeout(reject, 3000) });
            function fakeRedis() {
                return {
                    on: () => { },
                    del: noresponse,
                    flushdb: noresponse,
                    getBuffer: noresponse,
                    reset: noresponse,
                    setBuffer: noresponse,
                    setexBuffer: noresponse,
                };
            }

            sut = inject({
                'ioredis': fakeRedis,
                '../logger': silent,
            });
        });

        it('del returns a fulfilled promise of undefined', function () {
            return sut.create(defaultOptions).del('key').should.finally.be.undefined();
        });
        it('get returns a fulfilled promise of undefined', function () {
            return sut.create(defaultOptions).get('key').should.finally.be.undefined();
        });
        it('reset returns a fulfilled promise of undefined', function () {
            return sut.create(defaultOptions).reset().should.finally.be.undefined();
        });
        it('set returns a fulfilled promise of undefined', function () {
            return sut.create(defaultOptions).set('key', 'value').should.finally.be.undefined();
        });
    });
    describe('when Redis throws an error', function () {
        let sut;
        before(function () {
            let reject = () => Promise.reject(new Error('snap'));
            function fakeRedis() {
                return {
                    on: () => { },
                    del: reject,
                    flushdb: reject,
                    getBuffer: reject,
                    reset: reject,
                    setBuffer: reject,
                    setexBuffer: reject,
                };
            }

            sut = inject({
                'ioredis': fakeRedis,
                '../logger': silent,
            });
        });

        it('del returns a fulfilled promise of undefined', function () {
            return sut.create(defaultOptions).del('key').should.finally.be.undefined();
        });
        it('get returns a fulfilled promise of undefined', function () {
            return sut.create(defaultOptions).get('key').should.finally.be.undefined();
        });
        it('reset returns a fulfilled promise of undefined', function () {
            return sut.create(defaultOptions).reset().should.finally.be.undefined();
        });
        it('set returns a fulfilled promise of undefined', function () {
            return sut.create(defaultOptions).set('key', 'value').should.finally.be.undefined();
        });
    });
})
