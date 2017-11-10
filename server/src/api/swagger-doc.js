'use strict';

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const findInAncestor = require('../modules/find-in-ancestor');

const apiSpec = yaml.safeLoad(fs.readFileSync(findInAncestor(path.resolve(__dirname, 'swagger.yaml')), 'utf8'));

module.exports = apiSpec;
