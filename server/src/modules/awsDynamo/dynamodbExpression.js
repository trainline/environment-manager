'use strict';

function expressionScope() {
  let valName = i => `:val${i}`;
  let expressionAttributeValues = {};
  let expressionAttributeNames = {};
  let i = 0;

  function nameExpressionAttributeValue(value) {
    let t = valName(i);
    i += 1;
    expressionAttributeValues[t] = value;
    return t;
  }

  function nameExpressionAttributeName(result, name) {
    if (typeof name === 'number') {
      let elt = `[${name}]`;
      return result === null ? elt : `${result}${elt}`;
    } else {
      let elt = `#${name}`;
      expressionAttributeNames[elt] = name;
      return result === null ? elt : `${result}.${elt}`;
    }
  }

  return {
    nameExpressionAttributeName,
    nameExpressionAttributeValue,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues
  };
}

function compileOne(scope, expr) {
  let compile = compileOne.bind(null, scope);
  let infix = ([fn, ...args]) => {
    let compiled = args.map(compile).join(` ${fn} `);
    return args.length === 1 ? compiled : `(${compiled})`;
  };
  let prefix = ([fn, ...args]) => `${fn}(${args.map(compile).join(', ')})`;
  let attr = ([, ...exprs]) => exprs.reduce(scope.nameExpressionAttributeName, null);
  let val = ([, ...exprs]) => exprs.map(value => scope.nameExpressionAttributeValue(value)).join(', ');
  let list = ([, sep, ...items]) => `${items.map(compile).join(sep)}`;
  let update = ([, ...args]) => {
    let assign = opargs => opargs.map(compile).join(' = ');
    let ref = opargs => opargs.map(compile).join(', ');
    let operatorCompiler = {
      add: assign,
      delete: ref,
      remove: ref,
      set: assign
    };
    let grouped = args.reduce((acc, [op, ...opargs]) => {
      let stmt = operatorCompiler[op](opargs);
      if (acc[op] === undefined) {
        acc[op] = stmt;
      } else {
        acc[op] += `, ${stmt}`;
      }
      return acc;
    }, {});
    return Object.keys(grouped).map(key => `${key.toUpperCase()} ${grouped[key]}`).join(' ');
  };
  let compilers = {
    '=': infix,
    '<>': infix,
    '<': infix,
    '<=': infix,
    '>': infix,
    '>=': infix,
    '+': infix,
    '-': infix,
    '/': infix,
    '*': infix,
    'and': infix,
    'at': attr,
    'attr': attr,
    'list': list,
    'or': infix,
    'update': update,
    'val': val
  };

  if (Array.isArray(expr) && expr.length > 0) {
    let [fn] = expr;
    let compiler = compilers[fn] || prefix;
    return compiler(expr);
  } else {
    return `${expr}`;
  }
}

function compileAll(expressions) {
  let scope = expressionScope();
  if (Array.isArray(expressions)) {
    return compileAll({ Expression: expressions }, scope);
  }
  let result = {};
  Object.keys(expressions).forEach((key) => {
    result[key] = compileOne(scope, expressions[key]);
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
  compile: compileAll
};
