/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

require("should");
let path = require('path');
let retryLib = require('modules/dm-packer/retry');
let _ = require('lodash');

let nullLogger = {
  debug: _.noop,
  info: _.noop,
  warn: _.noop,
  error: _.noop,
};

describe("retry", function() {
  context("a function that always fails", function () {
    let retry = retryLib({backoff: () => 0, maxAttempts: 1, logger:nullLogger});
    let alwaysFail = () => Promise.reject(new Error("fail"));
    it("should fail", function() {
      return retry(alwaysFail).should.be.rejectedWith(/fail/);
    });
  });
  context("a function that fails once", function () {
    let retry = retryLib({backoff: () => 0, maxAttempts: 2, logger:nullLogger});
    let failOnce = i => i <= 1
      ? Promise.reject(new Error("fail"))
      : Promise.resolve(123);
    it("should succeed on the second attempt", function() {
      return retry(failOnce).should.finally.be.eql(123);
    });
  });
});
