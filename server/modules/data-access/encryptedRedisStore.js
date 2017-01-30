/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict'

let logger = require('modules/logger');
let Redis = require('ioredis');
let config = require('config');
let co = require('co');
let fp = require('lodash/fp');
let emCrypto = require('modules/emCrypto');

const EM_REDIS_ADDRESS = config.get('EM_REDIS_ADDRESS');
const EM_REDIS_PORT = config.get('EM_REDIS_PORT');
const EM_REDIS_CRYPTO_KEY = config.get('EM_REDIS_CRYPTO_KEY');
const EM_REDIS_CRYPTO_KEY_S3_BUCKET = config.get('EM_REDIS_CRYPTO_KEY_S3_BUCKET');
const EM_REDIS_CRYPTO_KEY_S3_KEY = config.get('EM_REDIS_CRYPTO_KEY_S3_KEY');

function create() {
  return co(function* () {
    let client = connectToRedis();
    let cryptoKey = yield getCryptoKey();

    return createEncryptedRedisStore(client, cryptoKey);
  });
}

function createEncryptedRedisStore(client, cryptoKey) {
  function get(key) {
    return client.getBuffer(key).then(value => {
      if (value === null) return null;
      return decrypt(value);
    });
  }

  function psetex(key, ttl, value) {
    return client.psetexBuffer(key, ttl, encrypt(value));
  }

  function encrypt(plaintext) {
    return emCrypto.encrypt(cryptoKey, new Buffer(JSON.stringify(plaintext)));
  }

  function decrypt(ciphertext) {
    return JSON.parse(emCrypto.decrypt(cryptoKey, ciphertext).toString());
  }

  return {
    get,
    psetex
  }
}

function connectToRedis() {
  let client = new Redis({ host: EM_REDIS_ADDRESS, port: EM_REDIS_PORT, lazyConnect: true, connectTimeout: 1000 });
  let events = ['close', 'connect', 'end', 'error', 'ready', 'reconnecting'];
  events.forEach((name) => {
    client.on(name, (e) => {
      logger.debug(`${name}: redis ${EM_REDIS_ADDRESS}:${EM_REDIS_PORT}`);
      if (e) {
        logger.debug(e);
      }
    });
  });
  client.on('error', e => logger.error(e));
  return client;
}

function getCryptoKey() {
  if (EM_REDIS_CRYPTO_KEY) {
    return Promise.resolve(EM_REDIS_CRYPTO_KEY);
  } else if (EM_REDIS_CRYPTO_KEY_S3_BUCKET && EM_REDIS_CRYPTO_KEY_S3_KEY) {
    return masterAccountClient.createS3Client().then(s3 => s3.getObject({
      Bucket: EM_REDIS_CRYPTO_KEY_S3_BUCKET,
      Key: EM_REDIS_CRYPTO_KEY_S3_KEY
    }).promise()).then(rsp => rsp.Body, (error) => {
      logger.warn(`Failed to get Redis Crypto Key: Bucket=${EM_REDIS_CRYPTO_KEY_S3_BUCKET} Key=${EM_REDIS_CRYPTO_KEY_S3_KEY}`);
      logger.error(error);
      return Promise.resolve();
    });
  } else {
    return Promise.resolve();
  }
}

module.exports = {
  create
}