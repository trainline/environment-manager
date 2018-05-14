/* eslint-disable */

module.exports = {
  logOut: () => {
    if (browser.isVisible('#logout')) {
      browser.click('#logout > a');
      browser.waitForVisible('#username');
    }
  },
  logIn: (username, password) => {
    if (browser.isVisible('#logout')) {
      browser.click('#logout > a');
      browser.waitForVisible('#username');
    }
    browser.setValue('#username', username || 'anyUser');
    browser.setValue('#password', password || 'anyPassword');
    browser.click('#sign-in');
    browser.waitForVisible('#logout');
  }
};