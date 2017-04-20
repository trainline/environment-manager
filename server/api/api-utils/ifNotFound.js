'use strict';

let { hasValue, when } = require('modules/functional');

let ifNotFound = when.bind(null, hasValue, data => res => res.json(data));

let notFoundMessage = resourceType =>
  () => res => res.status(404).json({ error: `The ${resourceType} was not found` });

module.exports = {
  ifNotFound,
  notFoundMessage
};
