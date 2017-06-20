'use strict'

let _ = require('lodash');
let co = require('co');
let rp = require('request-promise');

function createEMService(config, mainLogger) {
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

  function getAccounts() {
    return get('api/v1/config/accounts');
  }

  function getScheduledInstanceActions(awsAccount) {
    return get(`api/v1/instances/schedule-actions?account=${awsAccount}`);
  }

  function get(uri) {
    return co(function*() {
      if (!token) {
        token = yield getToken();
      }

      let response = yield request({
        uri: `${config.host}/${uri}`,
        rejectUnauthorized: false,
        headers: {
          authorization: `bearer ${token}`
        },
        json: true
      });

      return response;
    });
  }

  function request(req) {
    let loggableRequest = _.cloneDeep(req);

    if (loggableRequest.body && loggableRequest.body.password)
      loggableRequest.body.password = '**********';

    if (loggableRequest.headers && loggableRequest.headers.authorization)
      loggableRequest.headers.authorization = '**********';

    let logger = mainLogger.createSubLogger({ segmentName: 'Environment Manager', event: loggableRequest });
    logger.info(`EM API Call Started - ${req.uri}`, loggableRequest);

    return rp(req).then((result) => {
      let loggableResult = req.uri.match(/.*\/api\/v1\/token$/) ? '**********' : result;
      logger.info(`EM API Call Completed - ${req.uri}`, loggableResult);
      logger.close('Result', loggableResult);
      return result;
    })
    .catch((error) => {
      logger.error(`EM API Call Failed - ${req.uri}`, error);
      logger.close('Error', error);
      return Promise.reject(error);
    });
  }

  return { getAccounts, getScheduledInstanceActions };
}

module.exports = {
  create: createEMService
}