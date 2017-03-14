'use strict';

const console = require('console');
const { basename, resolve } = require('path');
const { cwd, env, exit } = require('process');
const { ensureDirExists, spawn } = require('./shared');

const OUTPUT_DIR = 'dist';

const DEFAULT_OPTS = {
    cwd: cwd(),
    env: env,
    timeout: 30 * 60 * 1000
};

function paramsToArray(obj) {
    return Object.keys(obj).map(key => `${key}=${obj[key]}`);
}

function main({ templateFile, s3bucket, stackName, parameters }) {
    let compiledTemplateFile = resolve(OUTPUT_DIR, basename(templateFile));

    return spawn('aws', ['cloudformation', 'validate-template', '--template-body', `file://${templateFile}`], DEFAULT_OPTS)
        .then(() => ensureDirExists(OUTPUT_DIR))
        .then(() => spawn('aws', ['cloudformation', 'package', '--template', templateFile, '--s3-bucket', s3bucket, '--output-template-file', compiledTemplateFile], DEFAULT_OPTS))
        .then(() => spawn('aws', ['cloudformation', 'deploy', '--template', compiledTemplateFile, '--stack-name', stackName, '--capabilities', 'CAPABILITY_NAMED_IAM', '--parameter-overrides'].concat(paramsToArray(parameters)), DEFAULT_OPTS))
        .then(() => exit(0))
        .catch(error => {
            console.log(error);
            exit(1)
        });
}

main({
    templateFile: 'EnvironmentManagerCommonResources.template.json',
    s3bucket: 'cloudformation-eu-west-1-886983751479',
    stackName: 'environment-manager-common',
    parameters: {
        pMasterAccountId: '886983751479'
    }
});
