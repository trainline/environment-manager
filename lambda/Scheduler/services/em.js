'use strict'

let co = require('co');
let request = require('request-promise');

function createEMService(config) {

  let token;

  function getToken() {
    return request({
      method: 'POST',
      uri: `${config.host}/api/token`,
      rejectUnauthorized: false,
      form: {
          grant_type: 'password',
          username: config.credentials.username,
          password: config.credentials.password
      },
    });
  }

  function getScheduledInstanceActions(account) {
    return co(function*() {
    
      if (!token) {
        token = yield getToken();
      }

      let jsonResponse = yield request({
        uri: `${config.host}/api/${account}/instances/schedule-actions`,
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