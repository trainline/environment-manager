'use strict';

module.exports = function create(status, value) {
  return response => response.format({
    'text/plain': () => response.status(status).send(value),
    'application/json': () => response.status(status).json({ url: value })
  });
};
