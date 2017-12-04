'use strict';

const fs = require('fs');
const path = require('path');
require('should');
const schema = require('../../../modules/schema/schema');

function getSchemas() {
  return fs.readdirSync(path.resolve(__dirname, '../../../schemas'))
  .filter(file => file !== 'schema.js')
  .map(file => path.basename(file, '.json'));
}

describe('schema', function () {
  describe('each schema should load without errors', function () {
    let schemas = getSchemas();
    schemas.forEach((schemaId) => {
      it(schemaId, function () {
        return schema(schemaId).then(({ test }) => test({})).should.be.fulfilled();
      });
    });
  });
  describe('schemas can be loaded more than once', function () {
    let schemas = getSchemas();
    schemas.forEach((schemaId) => {
      it(schemaId, function () {
        return Promise.all([schema(schemaId), schema(schemaId)]).should.be.fulfilled();
      });
    });
  });
});
