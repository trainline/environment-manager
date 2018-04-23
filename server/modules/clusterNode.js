'use strict';

const cluster = require('exp-leader-election');
const logger = require('./logger');
const config = require('../config').getUserValue('local');

const consulConfig = {
  key: 'locks/envmgr/leader',
  consul: config.consul
};

let leader = false;

if (config.IS_PRODUCTION) {
  cluster(consulConfig)
    .on('gainedLeadership', (...args) => {
      leader = true;
      logger.debug('Gained leadership', ...args);
    })
    .on('error', (err) => {
      if (leader) {
        logger.debug('Lost leadership');
      }
      leader = false;
      logger.error('Error during leader election / renewal', err);
    });
}

module.exports = {
  isLeader: () => {
    return leader;
  }
};
