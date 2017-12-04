'use strict';

const yaml = require('js-yaml');
const fs = require('fs');
const findInAncestor = require('../modules/find-in-ancestor');

const apiSpec = yaml.safeLoad(fs.readFileSync(findInAncestor('swagger.yaml', __dirname), 'utf8'));

module.exports = apiSpec;
