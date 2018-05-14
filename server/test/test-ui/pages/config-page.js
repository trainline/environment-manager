/* eslint-disable */

module.exports = {
  navigateToServices: () => {
    browser.click('#environmentsLink')
  },
  navigateToDeploymentMaps: () => {
    browser.click('#configDeploymentMapsLink');
  },
  navigateToLoadBalancer: () => {
    browser.click('#configLoadBalancersLink');
  },
  navigateToUpstreams: () => {
    browser.click('#configUpstreamsLink');
  },
  navigateToNotifications: () => {
    browser.click('#configNotificationsLink');
  },
  navigateToTeams: () => {
    browser.click('#configClustersLink');
  },
  navigateToEnvironmentTypes: () => {
    browser.click('#configEnvironmentTypesLink');
  },
  navigateToAccounts: () => {
    browser.click('#configAccountsLink');
  },
  clickPlatformServices: () => {
    browser.waitForExist('a=PlatformServices')
    browser.click('a=PlatformServices');
  }
};