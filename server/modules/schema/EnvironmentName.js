"use strict";

module.exports = {
  "id": "EnvironmentName",
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Environment Name",
  "description": "An Environment Name",
  "type": "string",
  "minLength": 1,
  "maxLength": 255,
  "pattern": "^[a-zA-Z][0-9a-zA-Z\.\-_]*$"
};
