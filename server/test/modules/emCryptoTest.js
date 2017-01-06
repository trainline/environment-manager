/* eslint-env mocha */

'use strict'

require('should');
let sut = require('modules/emCrypto');

describe('decrypting an encrypted value', function () {
    it('returns the input value', function () {
        let input = 'Hello World!';
        let password = 'my simple password';
        let ciphertext = sut.encrypt(password, input);
        let plaintext = sut.decrypt(password, ciphertext);
        plaintext.should.match(input);
    });
});