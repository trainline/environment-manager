'use strict';

const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const yaml = require('js-yaml');

const mkdir = Promise.promisify(fs.mkdir);
const readFile = Promise.promisify(fs.readFile);

const BUILD_AWS_RESOURCE_SCRIPT = 'build-aws-resource';
const CONCURRENCY = 4;

function spawn(cmd, args, opts) {
    const DEFAULT_OPTS = { shell: true };
    let options = Object.assign({}, DEFAULT_OPTS, opts);
    return new Promise((resolve, reject) => {
        let proc = child_process.spawn(cmd, args, options);
        proc.once('close', code => {
            if (code === 0) {
                resolve(code);
            } else {
                reject(new Error(`Command failed with code ${code}: "${cmd} ${args}" in ${options.cwd}`));
            }
        });
        proc.stderr.pipe(process.stderr);
        proc.stdout.pipe(process.stdout);
    });
}

function ensureDirExists(dir) {
    let ensureDirExistsNonTransitive = d =>
        mkdir(d).catch(error => error.code === 'EEXIST' ? Promise.resolve() : Promise.reject(error));
    let reducer = ([first, ...rest], nxt) =>
        first === undefined ? [nxt] : [path.join(first, nxt)].concat(first, rest);
    let dirs = path.normalize(dir).split(path.sep).reduce(reducer, []).reverse();
    return Promise.mapSeries(dirs, ensureDirExistsNonTransitive);
}

function readConfig() {
    return readFile('config.yaml', 'utf-8')
        .then(content => yaml.safeLoad(content))
}

module.exports = {
    BUILD_AWS_RESOURCE_SCRIPT,
    CONCURRENCY,
    ensureDirExists,
    readConfig,
    spawn
}