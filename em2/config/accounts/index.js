let rl = require('roast-lambda');
let _ = require('lodash');

let lambdas = require('./src/lambdas');
let dynamo = require('./src/services/dynamo');

function inject(fn) {
  return (args) => {
    args.dynamo = dynamo.createClient(args.AWS, args.context.awsRegion, args.context.env.STAGE);
    return fn(args);
  };
}

_.forOwn(lambdas, (lambda, name) => {
  lambda.handler = inject(lambda.handler);
  exports[name] = rl.init(lambda);
});