'use strict'

let co = require('co');
let request = require('request-promise');

function createEMService(config) {

  let token;

  function getToken() {
    return request({
      method: 'POST',
      uri: `https://${config.host}/api/token`,
      rejectUnauthorized: false,
      form: {
          grant_type: 'password',
          username: config.credentials.username,
          password: config.credentials.password
      },
    });
  }

  function getAllEnvironments() {
    return co(function*() {
    
      if (!token) {
        token = yield getToken();
      }

      let jsonResponse = yield request({
        uri: 'https://environmentmanager.corp.local/api/ops/environments',
        rejectUnauthorized: false,
        headers: {
          authorization: `bearer ${token}`
        }
      });

      return JSON.parse(jsonResponse);

    });
  }

  return { getAllEnvironments };

}

module.exports = {
  create: createEMService
}