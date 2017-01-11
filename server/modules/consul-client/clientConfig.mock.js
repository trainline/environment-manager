/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = parameters => (
  Promise.resolve({
    host: '10.249.16.74',
    port: '8500',
    defaults: {
      dc: 'tl-c50',
    },
    promisify: parameters.promisify,
  })
);
