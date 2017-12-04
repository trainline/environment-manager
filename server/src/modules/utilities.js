/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

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

module.exports = { safeParseJSON, offsetMilliseconds };
