'use strict'

let co = require('co');
let request = require('request-promise');

function createEMService(config) {

  let token;

  function getToken() {
    return request({
      method: 'POST',
      uri: `${config.host}/api/v1/token`,
      rejectUnauthorized: false,
      body: {
          username: config.credentials.username,
          password: config.credentials.password
      },
      json: true
    });
  }

  function getScheduledInstanceActions(account) {
    return co(function*() {
    
      if (!token) {
        token = yield getToken();
      }

      let jsonResponse = yield request({
        uri: `${config.host}/api/v1/instances/schedule-actions?account=${account}`,
        rejectUnauthorized: false,
        headers: {
          authorization: `bearer ${token}`
        }
      });

      return JSON.parse(jsonResponse);

    });
  }

  return { getScheduledInstanceActions };

}

module.exports = {
  create: createEMService
}