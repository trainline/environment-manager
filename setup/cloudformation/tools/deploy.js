'use strict';

const { basename, resolve } = require('path');
const { cwd, env, exit } = require('process');
const { ensureDirExists, spawn } = require('./common');

const OUTPUT_DIR = 'dist';

const DEFAULT_OPTS = {
    cwd: cwd(),
    env: env,
    timeout: 30 * 60 * 1000
};

function paramsToArray(obj) {
    function paramToString(key) {
        let value = obj[key];
        if (Array.isArray(value)) {
            return `${key}=${value.join(',')}`
        } else {
            return `${key}=${value}`
        }
    }
    return Object.keys(obj).map(paramToString);
}

function deploy({ templateFile, s3bucket, stackName, parameters }) {
    let compiledTemplateFile = resolve(OUTPUT_DIR, basename(templateFile));

    return spawn('aws', ['cloudformation', 'validate-template', '--template-body', `file://${templateFile}`], DEFAULT_OPTS)
        .then(() => ensureDirExists(OUTPUT_DIR))
        .then(() => spawn('aws', ['cloudformation', 'package', '--template', templateFile, '--s3-bucket', s3bucket, '--output-template-file', compiledTemplateFile], DEFAULT_OPTS))
        .then(() => spawn('aws', ['cloudformation', 'deploy', '--template', compiledTemplateFile, '--stack-name', stackName, '--capabilities', 'CAPABILITY_NAMED_IAM', '--parameter-overrides'].concat(paramsToArray(parameters)), DEFAULT_OPTS))
        .then(() => exit(0));
}

module.exports = deploy;
