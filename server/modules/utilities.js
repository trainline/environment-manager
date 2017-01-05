/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let querystring = require('querystring');
let url = require('url');

/**
 * Attempts to parse a JSON string into an object, returning null on error
 *
 * @param raw {String} The raw JSON string
 * @returns {Object|null} The parsed Object or null if a parsing error occured.
 */
function safeParseJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch (exception) {
    return null;
  }
}

/**
 *
 * @param date
 * @param offset
 * @returns {*}
 */
function offsetMilliseconds(date, offset) {
  date.setMilliseconds(date.getMilliseconds() + offset);
  return date;
}

/**
 * @param target
 * @returns {{uri: uri}}
 */
function make(target) {
  return {

    uri: function() {
      var result = '';

      target.forEach(function(segment) {
        if(!segment) return;
        result += '/' + segment;
      });

      return result;
    }
  }
}

/**
 * @param request
 * @returns {null}
 */
function extractQuery(request) {
  var parsedUrl = url.parse(request.url);
  return parsedUrl.query ? querystring.parse(parsedUrl.query) : null;
}

module.exports = { make, extractQuery, safeParseJSON, offsetMilliseconds };