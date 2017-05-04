/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { updateAuditMetadata } = require('modules/data-access/dynamoAudit');
let { compareAndSetVersionOnUpdate, setVersionOnUpdate } = require('modules/data-access/dynamoVersion');
let { flow } = require('lodash/fp');

function softDelete({ key, metadata, expectedVersion }) {
  let updateExpression = ['update', ['set', ['at', '__Deleted'], ['val', true]]];
  let updateWithDeleteMarker = expectedVersion
    ? flow(
      updateAuditMetadata,
      UpdateExpression => ({
        key,
        expressions: { UpdateExpression },
        expectedVersion
      }),
      compareAndSetVersionOnUpdate
    )
    : flow(
      updateAuditMetadata,
      UpdateExpression => ({
        key,
        expressions: { UpdateExpression }
      }),
      setVersionOnUpdate
    );
  return updateWithDeleteMarker({ key, metadata, updateExpression });
}

module.exports = {
  softDelete
};
