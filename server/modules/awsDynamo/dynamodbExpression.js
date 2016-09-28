'use strict';

function reduce(functions, expr) {
  if (Array.isArray(expr)) {
    let fname = expr[0];
    let fn = functions[fname];
    if (fn === undefined) {
      throw new Error(`Function undeclared: ${fname}.`);
    }
    return fn(expr.slice(1).map(reduce.bind(null, functions)));
  } else {
    return expr;
  }
}

function expressionScope() {
  let valName = i => `:val${i}`;
  let qname = name => `#${name}`;
  let expressionAttributeValues = {};
  let expressionAttributeNames = {};
  let i = 0;

  function nameExpressionAttributeValue(value) {
    let t = valName(i++);
    expressionAttributeValues[t] = value;
    return t;
  }

  function nameExpressionAttributeName(name) {
    let t = qname(name);
    expressionAttributeNames[t] = name;
    return t;
  }

  return {
    nameExpressionAttributeName,
    nameExpressionAttributeValue,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };
}

function compileOne(expr, scope) {
  let functions = {
    'and': exprs => exprs.map(x => `(${x})`).join(' and '),
    '=': exprs => exprs.map(x => `(${x})`).join(' = '),
    'attr': exprs => exprs.map(name => scope.nameExpressionAttributeName(name)).join('.'),
    'val': exprs => exprs.map(value => scope.nameExpressionAttributeValue(value)).join(', '),
  };

  let expression = reduce(functions, expr);
  return expression;
}

function compile(expressions) {
  let scope = expressionScope();
  if (Array.isArray(expressions)) {
    return compile({ Expression: expressions }, scope);
  }
  let result = {};
  for (let key of Object.keys(expressions)) {
    result[key] = compileOne(expressions[key], scope);
  }
  result.ExpressionAttributeNames = scope.ExpressionAttributeNames;
  result.ExpressionAttributeValues = scope.ExpressionAttributeValues;
  return result;
}

module.exports = {
  compile,
};
