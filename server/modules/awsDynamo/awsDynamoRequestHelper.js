/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function addExpressionAttributeNamesToRequest(request, names) {
  if (!request.ExpressionAttributeNames) {
    request.ExpressionAttributeNames = {};
  }

  let aliases = [];

  names.forEach((name) => {
    request.ExpressionAttributeNames[name.alias] = name.name;
    aliases.push(name.alias);
  });

  return aliases;
}

function addExpressionAttributeValuesToRequest(request, value) {
  if (!request.ExpressionAttributeValues) {
    request.ExpressionAttributeValues = {};
  }

  let alias = `:p${Object.keys(request.ExpressionAttributeValues).length}`;
  request.ExpressionAttributeValues[alias] = value;

  return alias;
}

function addConditionsToRequest(request, conditions, propertyName) {
  if (!conditions.length) return;

  let expressionBodies = conditions.map((condition) => {
    let nameAliases = addExpressionAttributeNamesToRequest(request, condition.getNames());
    let valueAlias = addExpressionAttributeValuesToRequest(request, condition.getValue());

    return condition.toString(nameAliases.join('.'), valueAlias);
  });

  request[propertyName] = expressionBodies.join(' AND ');
}

function addFilterExpressionToRequest(request, conditions) {
  addConditionsToRequest(request, conditions, 'FilterExpression');
}

function addConditionExpressionToRequest(request, conditions) {
  addConditionsToRequest(request, conditions, 'ConditionExpression');
}

function addUpdateExpressionToRequest(request, expressions) {
  let addExpressions = [];
  let setExpressions = [];

  expressions.forEach((expression) => {
    let nameAliases = addExpressionAttributeNamesToRequest(request, expression.getNames());
    let valueAlias = addExpressionAttributeValuesToRequest(request, expression.getValue());

    if (expression.getOperation() === 'add') {
      let expressionAdd = [nameAliases.join('.'), valueAlias].join(' ');
      addExpressions.push(expressionAdd);
      return;
    }

    if (expression.getOperation() === 'set') {
      let expressionSet = [nameAliases.join('.'), '=', valueAlias].join(' ');
      setExpressions.push(expressionSet);
    }
  });

  let expressionBodies = [];
  if (addExpressions.length) expressionBodies = expressionBodies.concat(['add'], addExpressions.join(', '));
  if (setExpressions.length) expressionBodies = expressionBodies.concat(['set'], setExpressions.join(', '));

  request.UpdateExpression = expressionBodies.join(' ');
}

function addResultsLimit(request, limit) {
  request.Limit = limit;
}

module.exports = {
  addFilterExpression: addFilterExpressionToRequest,
  addConditionExpression: addConditionExpressionToRequest,
  addUpdateExpression: addUpdateExpressionToRequest,
  addResultsLimit,
};
