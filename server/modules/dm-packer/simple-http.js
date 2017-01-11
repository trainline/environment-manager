/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

function getContent(url) {
  const isError = response => ! (200 <= response.statusCode && response.statusCode < 300);
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    let scheme = url.startsWith('https') ? require('https') : require('http');
    const request = scheme.get(url, (response) => {
      // handle http errors
      if (isError(response)) {
        let error = new Error(`HTTP GET ${url} failed with status code ${response.statusCode}: ${response.statusMessage}`);
        error.statusCode = response.statusCode;
        error.statusMessage = response.statusMessage;
        error.url = url;
        reject(error);
      }
      // temporary data holder
      const body = [];
      // on every content chunk, push it to the data array
      response.on('data', (chunk) => body.push(chunk));
      // we are done, resolve promise with those joined chunks
      response.on('end', () => resolve(body.join('')));
    });
    // handle connection errors of the request
    request.on('error', (err) => reject(err));
  });
}

function getResponseStream(url) {
  const isError = response => ! (200 <= response.statusCode && response.statusCode < 300);
  return new Promise((resolve, reject) => {
    // select http or https module, depending on reqested url
    let scheme = url.startsWith('https') ? require('https') : require('http');
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
    request.on('error', (err) => reject(err));
  });
}

module.exports = { getContent: getContent, getResponseStream: getResponseStream };
