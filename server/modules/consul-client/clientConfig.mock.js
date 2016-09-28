/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

module.exports = (parameters) => {
  return Promise.resolve({
    host: '10.249.157.162',
    port: '8500',
    defaults: {
      dc: 'tl-cluster',
    },
    promisify: parameters.promisify,
  });
};
