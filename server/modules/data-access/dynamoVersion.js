/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let fp = require('lodash/fp');

let versionOf = fp.get(['Audit', 'Version']);

function compareAndSetVersionOnReplace({ record, expectedVersion, expressions }) {
  let audit = Object.assign({}, record.Audit, { Version: expectedVersion + 1 });
  let condition =
    ['=',
      ['at', 'Audit', 'Version'],
      ['val', expectedVersion]];
  if (expressions && expressions.ConditionExpression) {
    let newExpressions = {
      ConditionExpression: ['and', expressions.ConditionExpression, condition]
    };
    return {
      record: Object.assign({}, record, { Audit: audit }),
      expressions: Object.assign({}, expressions, newExpressions)
    };
  } else {
    return {
      record: Object.assign({}, record, { Audit: audit }),
      expressions: {
        ConditionExpression: condition
      }
    };
  }
}

function compareAndSetVersionOnCreate(hashKeyAttributeName) {
  return ({ record, expressions }) => {
    let audit = Object.assign({}, record.Audit, { Version: 1 });
    let condition =
      ['attribute_not_exists', ['at', hashKeyAttributeName]];
    if (expressions && expressions.ConditionExpression) {
      let newExpressions = {
        ConditionExpression: ['and', expressions.ConditionExpression, condition]
      };
      return {
        record: Object.assign({}, record, { Audit: audit }),
        expressions: Object.assign({}, expressions, newExpressions)
      };
    } else {
      return {
        record: Object.assign({}, record, { Audit: audit }),
        expressions: {
          ConditionExpression: condition
        }
      };
    }
  };
}

function compareVersionOnDelete(hashKeyAttributeName) {
  return ({ key, expectedVersion, expressions }) => {
    let condition =
      ['or',
        ['attribute_not_exists', ['at', hashKeyAttributeName]],
        ['=',
          ['at', 'Audit', 'Version'],
          ['val', expectedVersion]]
      ];
    if (expressions && expressions.ConditionExpression) {
      let newExpressions = {
        ConditionExpression: ['and', expressions.ConditionExpression, condition]
      };
      return {
        key,
        expressions: Object.assign({}, expressions, newExpressions)
      };
    } else {
      return {
        key,
        expressions: {
          ConditionExpression: condition
        }
      };
    }
  };
}

module.exports = {
  compareAndSetVersionOnReplace,
  compareAndSetVersionOnCreate,
  compareVersionOnDelete,
  versionOf
};
