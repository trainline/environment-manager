/* eslint-disable */

module.exports = {
  load: () => {
    browser.url('http://localhost:8080');
  },
  navigateToEnvironments: () => {
    browser.click('#environmentsLink');
  },
  navigateToOperations: () => {
    browser.click('#operationsLink');
  },
  navigateToCompare: () => {
    browser.click('#compareLink');
  },
  navigateToConfiguration: () => {
    browser.click('#configurationLink');
    browser.waitForVisible('#configServicesLink');
  }
};