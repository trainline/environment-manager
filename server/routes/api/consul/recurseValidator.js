/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function getRecurseValue(input) {
  /**
   * TODO: This will always set recurse=true if input is *any* value. This is not the
   * intended behaviour but it has become expected behaviour from clients.
   * This shoud be fixed to behave as expected and documented when API routes are refactored.
   */
  return input !== undefined && input !== null;
}

module.exports = { getRecurseValue };
