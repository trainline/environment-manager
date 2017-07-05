'use strict'

let { execSync } = require('child_process');
let fs = require('fs');
let path = require('path');
let process = require('process');
let version = process.env['npm_package_version'];

function getShortCommit(directory) {
    return execSync('git rev-parse --short HEAD', {
        cwd: directory,
        encoding: 'utf-8',
        env: process.env,
        timeout: 1000
    }).replace(/[\r\n]/g, '');
}

function gitDescribe(directory) {
    return execSync('git describe', {
        cwd: directory,
        encoding: 'utf-8',
        env: process.env,
        timeout: 1000
    }).replace(/[\r\n]/g, '');
}

function packageFileAt(directory) {
    return path.resolve(directory, 'package.json');
}

function readPackageFile(directory) {
    let packageDef = JSON.parse(fs.readFileSync(packageFileAt(directory), { encoding: 'utf-8' }));
    return packageDef;
}

function updateVersion(directory, fn) {
    let packageDef = readPackageFile(directory);
    packageDef.version = fn(packageDef.version);
    let content = JSON.stringify(packageDef, null, 2) + '\n';
    fs.writeFileSync(packageFileAt(directory), content, { encoding: 'utf-8' });
}

module.exports = {
    getShortCommit,
    gitDescribe,
    readPackageFile,
    updateVersion
};
