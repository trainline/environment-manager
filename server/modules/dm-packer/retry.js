'use strict';

module.exports = function (options) {
  let opts = Object.assign({}, defaults, options);

  if (opts.maxAttempts < 1) {
    throw new Error('Max attempts must be 1 or greater.');
  }

  let n = opts.maxAttempts;
  let waitFor = opts.wait;
  let millisecondsToWait = opts.backoff;
  let logger = opts.logger;

  return retry;

  function retry(fn) {
    return loop(1);

    function loop(i) {
      return Promise.resolve(fn(i)).catch((error) => {
        if (n <= i) {
          logger.error(`Final attempt ${i} of ${n} failed.`);
          return Promise.reject(error);
        }
        logger.warn(JSON.stringify(error));
        let t = millisecondsToWait(i);
        logger.warn(`Attempt ${i} of ${n} failed. Retrying in ${t} milliseconds`);
        return waitFor(t).then(() => loop(1 + i));
      });
    }
  }
};

let defaults = {
  backoff: i => Math.round(5000 * (1 + Math.random()) * Math.pow(2, (i - 1))), // eslint-disable-line no-restricted-properties
  logger: {
    debug: console.log.bind(console),
    info: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  },
  maxAttempts: 5,
  wait: milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))
};

