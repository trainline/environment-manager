/* eslint-env mocha */

'use strict'

require('should');
let emCrypto = require('modules/emCrypto');
let fp = require('lodash/fp');
let proxyquire = require('proxyquire');

let silent = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
}

let TTL = 30;

let sut = proxyquire('modules/data-access/cacheManagerEncryptedRedis', {
    'modules/logger': silent,
});

describe('encrypted Redis cache manager', function () {
    describe('set then get returns the input unmodified', function () {
        context('when no encryption transformation is specified', function () {
            let inputs = [null, false, 0, 'A', { a: 'A' }];
            inputs.forEach(input => {
                it(`${input}`, function () {
                    let options = {
                        host: 'localhost',
                        port: 6379,
                    };
                    let redis = sut.create(options);
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

                    let options = {
                        host: 'localhost',
                        port: 6379,
                        valueTransform: {
                            toStore: encrypt,
                            fromStore: decrypt,
                        },
                    };
                    let redis = sut.create(options);
                    return redis.set('a', input, { ttl: TTL })
                        .then(() => redis.get('a'))
                        .should.finally.eql(input);
                });
            });
        });
    });
})