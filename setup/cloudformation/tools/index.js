'use strict';

const Promise = require('bluebird');
const { buildAwsResources, buildCloudFormationTemplate } = require('cfn-packager');
const program = require('commander');
const console = require('console');
const fs = require('fs');
const globby = require('globby');
const yaml = require('js-yaml');
const { extname } = require('path');
const { exit } = require('process');

const deploy = require('./deploy');
const myPackageInfo = require('../package.json');

const readFile = Promise.promisify(fs.readFile);

function readConfig(configFile) {
    return Promise.resolve().then(() => {
        let ext = extname(configFile);
        let parseContent = (() => {
            if (/\.json/i.test(ext)) {
                return content => JSON.parse(content);
            } else if (/\.yaml/i.test(ext)) {
                return content => yaml.safeLoad(content);
            } else {
                throw new Error('Configuration file format is unsupported. Supported formats: json, yaml');
            }
        })();
        return readFile(configFile).then(parseContent);
    });
}

function buildCloudFormationTemplates(config) {
    return globby(['*.template.js'])
        .then(templates => Promise.mapSeries(templates, template => buildCloudFormationTemplate({ template, config })));
}

program
    .version(myPackageInfo.version)

program
    .command('build')
    .description('build')
    .option('-c, --config <file>', 'A configuration file')
    .action(function (options) {
        if (options.config === undefined) {
            console.error('A configuration file is required');
            program.help();
            exit(1);
        }
        readConfig(options.config)
            .then(config => buildAwsResources()
                .then(() => buildCloudFormationTemplates(config)))
            .catch(error => {
                console.error(error);
                exit(1);
            })
    });

program
    .command('deploy')
    .description('deploy')
    .option('-c, --config <file>', 'A configuration file')
    .action(function (options) {
        if (options.config === undefined) {
            console.error('A configuration file is required');
            program.help();
            exit(1);
        }
        readConfig(options.config)
            .then(deploy)
            .catch(error => {
                console.error(error);
                exit(1);
            })
    });

program
    .command('*')
    .action(function () {
        program.help();
    })

program.parse(process.argv);