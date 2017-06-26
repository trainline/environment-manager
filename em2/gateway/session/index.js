let rl = require('roast-lambda');
let _ = require('lodash');

let lambdas = require('./src/lambdas');

function inject(fn) {
  return (args) => {
    return fn(args);
  };
}

_.forOwn(lambdas, (lambda, name) => {
  lambda.handler = inject(lambda.handler);
  exports[name] = rl.init(lambda);
});