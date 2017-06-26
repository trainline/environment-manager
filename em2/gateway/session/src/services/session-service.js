'use strict';

const co = require('co');

/**
 * Step through authentication requirements.
 *    - Get a session from the session store
 *    - Create a session if one doesn't exist
 *    - Store the session in the session store
 *    - Pass the session details back to the caller
 * @param {*} param0 
 */
const authenticate = ({ user }) => {
  return co(function* () {

    return Promise.resolve("Hello")
    // let existingSession = yield getSession(user);

    // if (existingSession) {
    //   return Promise.resolve('existing session found');
    // }

    // let session = yield createSession(user);
    // let storeId = yield storeSession(session);

    // return Promise.resolve(session);
  });
};

/**
 * Take the user data and see if there is already a valid session.
 * @param {*} user 
 */
const getSession = (user) => {
  //Temporarily say the user has not got a stored session to use...
  return co(function* () {
    user.session = null;

    const db = () => { };

    const sessionData = db(user)

    if (sessionData) {
      user.stored = true;
      user.session = sessionData;
    }

    return Promise.resolve(user);
  });
};

/**
 * Take the user data and create a new session if there isn't one already.
 * @param {*} user 
 */
const createSession = (user) => {
  return co(function* () {
    if (!user.session) {
      user.session = {
        "token": "lovely lovely token!"
      }
      return Promise.resolve(user);
    } else {
      return Promise.resolve(user);
    }
  });
};

/**
 * Store the session details in the session store.
 * @param {*} user 
 */
const storeSession = (user) => {
  return co(function* () {
    return Promise.resolve(user);
  });
};

module.exports = {
  authenticate,
  getSession,
  createSession,
  storeSession
};
