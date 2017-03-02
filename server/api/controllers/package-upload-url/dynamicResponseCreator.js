'use strict';

module.exports = function create(request, status, value) {
  if (request.accepts('application/json')) {
    return response => response.status(status).json({ url: value });
  }

  return response => response.status(status).send(value);
};
