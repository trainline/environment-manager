'use strict';

function reduce(reducer, expression) {
  function loop(parens, expr) {
    if (Array.isArray(expr)) {
      let fname = expr[0];
      let fn = reducer(fname);
      return parens(fn(fname, expr.slice(1).map(loop.bind(null, x => `(${x})`))));
    } else {
      return expr;
    }
  }
  return loop(x => x, expression);
}

function expressionScope() {
  let valName = i => `:val${i}`;
  let qname = name => `#${name}`;
  let expressionAttributeValues = {};
  let expressionAttributeNames = {};
  let i = 0;

  function nameExpressionAttributeValue(value) {
    let t = valName(i);
    i += 1;
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
    ExpressionAttributeValues: expressionAttributeValues
  };
}

function compileOne(expr, scope) {
  let infix = (fname, args) => args.map(x => `${x}`).join(` ${fname} `);
  let prefix = (fname, args) => `${fname}(${args.map(x => `${x}`).join(', ')})`;
  let attr = (_, exprs) => exprs.map(name => scope.nameExpressionAttributeName(name)).join('.');
  let val = (_, exprs) => exprs.map(value => scope.nameExpressionAttributeValue(value)).join(', ');
  let reducers = {
    '=': infix,
    '+': infix,
    '-': infix,
    '/': infix,
    '*': infix,
    'and': infix,
    'at': attr,
    'attr': attr,
    'or': infix,
    'val': val,
  };
  let reducerFromFunction = fname => reducers[fname] || prefix;

  let expression = reduce(reducerFromFunction, expr);
  return expression;
}

function compile(expressions) {
  let scope = expressionScope();
  if (Array.isArray(expressions)) {
    return compile({ Expression: expressions }, scope);
  }
  let result = {};
  Object.keys(expressions).forEach((key) => {
    result[key] = compileOne(expressions[key], scope);
  });
  ['ExpressionAttributeNames', 'ExpressionAttributeValues'].forEach(
    (key) => {
      if (Object.keys(scope[key]).length > 0) {
        result[key] = scope[key];
      }
    }
  );
  return Object.freeze(result);
}

module.exports = {
  compile
};
