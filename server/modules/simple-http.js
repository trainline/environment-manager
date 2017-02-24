/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let http = require('http');
let https = require('https');

function getResponseStream(url) {
  const isError = response => !(response.statusCode >= 200 && response.statusCode < 300);
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    let scheme = url.startsWith('https') ? https : http;
    const request = scheme.get(url, (response) => {
      // handle http errors
      if (isError(response)) {
        let error = new Error(`HTTP GET ${url} failed with status code ${response.statusCode}: ${response.statusMessage}`);
        error.statusCode = response.statusCode;
        error.statusMessage = response.statusMessage;
        error.url = url;
        reject(error);
      }
      resolve(response);
    });
    // handle connection errors of the request
    request.on('error', err => reject(err));
  });
}

module.exports = { getResponseStream };
