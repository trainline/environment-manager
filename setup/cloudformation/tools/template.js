'use strict'

const Promise = require('bluebird');
const { readConfig } = require('./common');
const fs = require('fs');
const globby = require('globby');
const { basename, resolve } = require('path');

const writeFile = Promise.promisify(fs.writeFile);

function string(obj) {
    return JSON.stringify(obj);
}

Promise.join(
    globby(['*.template.js'])
        .then(files => files.map(file => ({ name: basename(file, '.js'), template: require(resolve(file)) }))),
    readConfig(),
    (templates, config) => Promise.mapSeries(templates, ({ name, template }) => writeFile(`${name}.json`, string(template(config))))
);
