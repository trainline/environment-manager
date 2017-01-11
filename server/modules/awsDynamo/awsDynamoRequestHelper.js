/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

function addExpressionAttributeNamesToRequest(request, names) {
  if (!request.ExpressionAttributeNames)
    request.ExpressionAttributeNames = {};

  var aliases = [];

  names.forEach(function (name) {
    request.ExpressionAttributeNames[name.alias] = name.name;
    aliases.push(name.alias);
  });

  return aliases;
};

function addExpressionAttributeValuesToRequest(request, value) {
  if (!request.ExpressionAttributeValues)
    request.ExpressionAttributeValues = {};

  var alias = ':p' + Object.keys(request.ExpressionAttributeValues).length;
  request.ExpressionAttributeValues[alias] = value;

  return alias;
}

function addConditionsToRequest(request, conditions, propertyName) {
  if (!conditions.length) return;

  var expressionBodies = conditions.map(function (condition) {
    var nameAliases = addExpressionAttributeNamesToRequest(request, condition.getNames());
    var valueAlias = addExpressionAttributeValuesToRequest(request, condition.getValue());

    return condition.toString(nameAliases.join('.'), valueAlias);
  });

  request[propertyName] = expressionBodies.join(' AND ');
};

function addFilterExpressionToRequest(request, conditions) {
  addConditionsToRequest(request, conditions, 'FilterExpression');
};

function addConditionExpressionToRequest(request, conditions) {
  addConditionsToRequest(request, conditions, 'ConditionExpression');
};

function addUpdateExpressionToRequest(request, expressions) {

  var addExpressions = [];
  var setExpressions = [];

  expressions.forEach(function (expression) {
    var nameAliases = addExpressionAttributeNamesToRequest(request, expression.getNames());
    var valueAlias = addExpressionAttributeValuesToRequest(request, expression.getValue());

    if (expression.getOperation() === 'add') {
      var expression = [nameAliases.join('.'), valueAlias].join(' ');
      addExpressions.push(expression);
      return;
    }

    if (expression.getOperation() === 'set') {
      var expression = [nameAliases.join('.'), '=', valueAlias].join(' ');
      setExpressions.push(expression);
      return;
    }
  });

  var expressionBodies = [];
  if (!!addExpressions.length) expressionBodies = expressionBodies.concat(['add'], addExpressions.join(', '));
  if (!!setExpressions.length) expressionBodies = expressionBodies.concat(['set'], setExpressions.join(', '));

  request.UpdateExpression = expressionBodies.join(' ');
};

function addResultsLimit(request, limit) {
  request.Limit = limit;
}

module.exports = {
  addFilterExpression: addFilterExpressionToRequest,
  addConditionExpression: addConditionExpressionToRequest,
  addUpdateExpression: addUpdateExpressionToRequest,
  addResultsLimit: addResultsLimit,
};
