'use strict'

let childProcess = require('child_process');
let path = require('path');
let process = require('process');
let version = process.env['npm_package_version'];

function versionPackage(rootDirectory) {
    return childProcess.execSync(`npm version "${version}" && git add -A`, {
        cwd: rootDirectory,
        env: process.env
    })
}

['client', 'server']
    .map(relDir => path.resolve(process.cwd(), relDir))
    .forEach(versionPackage);
