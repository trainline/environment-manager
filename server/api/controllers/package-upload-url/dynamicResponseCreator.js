'use strict';

module.exports = function create(status, value) {
  return response => response.format({
    'text/plain': () => response.status(status).send(value), // This is the default if no "Accept" header specified; see https://expressjs.com/en/api.html#res.format
    'application/json': () => response.status(status).json({ url: value })
  });
};
