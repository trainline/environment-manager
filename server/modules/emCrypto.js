/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let crypto = require('crypto');

const CIPHER_ALGORITHM = 'aes-256-gcm';
const CONTENT_LENGTH_BYTES = 32 / 8;
const HASH_ALGORITHM = 'sha256';
const ITERATIONS = 1000;
const KEY_LENGTH = 32;

function bufOfInt(i) {
  let buf = new Buffer(CONTENT_LENGTH_BYTES);
  buf.writeUInt32LE(i);
  return buf;
}

function pack(buffers) {
  let sizeThenContent = buf => [bufOfInt(buf.length), buf];
  return Buffer.concat(buffers.map(sizeThenContent).reduce((acc, nxt) => acc.concat(nxt), []));
}

function unpack(buffer) {
  let offset = 0;
  let output = [];
  while (offset < buffer.length) {
    let contentLength = buffer.readUInt32LE(offset);
    let contentStart = offset + CONTENT_LENGTH_BYTES;
    output.push(buffer.slice(contentStart, contentStart + contentLength));
    offset = offset + CONTENT_LENGTH_BYTES + contentLength;
  }
  return output;
}

function encrypt(key, plaintext) {
  let iv = crypto.randomBytes(12);
  let salt = crypto.randomBytes(16);
  let sessionKey = crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, HASH_ALGORITHM);
  let cipher = crypto.createCipheriv(CIPHER_ALGORITHM, sessionKey, iv);
  let encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  let tag = cipher.getAuthTag();
  return pack([
    new Buffer(CIPHER_ALGORITHM, 'utf8'),
    new Buffer(HASH_ALGORITHM, 'utf8'),
    iv,
    salt,
    bufOfInt(ITERATIONS),
    bufOfInt(KEY_LENGTH),
    tag,
    encrypted]);
}

function decrypt(key, ciphertext) {
  let parts = unpack(ciphertext);
  let cipherAlgorithm = parts[0].toString('utf8');
  let hashAlgorithm = parts[1].toString('utf8');
  let iv = parts[2];
  let salt = parts[3];
  let iterations = parts[4].readUInt32LE();
  let keyLength = parts[5].readUInt32LE();
  let tag = parts[6];
  let content = parts[7];
  let sessionKey = crypto.pbkdf2Sync(key, salt, iterations, keyLength, hashAlgorithm);
  let cipher = crypto.createDecipheriv(cipherAlgorithm, sessionKey, iv);
  cipher.setAuthTag(tag);
  let decrypted = cipher.update(content) + cipher.final();
  return decrypted;
}

module.exports = {
  decrypt,
  encrypt,
};
