'use strict';

const buffer = require('buffer');
const base64 = 'base64';
const utf8 = 'utf8';

let decode = str => JSON.parse(new buffer.Buffer(str, base64).toString(utf8));

let encode = obj => new buffer.Buffer(JSON.stringify(obj), utf8).toString(base64);

module.exports = {
  decode,
  encode
};
