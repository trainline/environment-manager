/* eslint-disable */
'use strict';

var homePage = require('../../pages/home-page')
var loginPage = require('../../pages/login-page')
var configPage = require('../../pages/config-page')
var deploymentMapPage = require('../../pages/config/deploymentmap-page')

var assert = require('assert');

describe('When working with deployment maps', function () {
  beforeEach(() => {
    homePage.load();
    loginPage.logIn('anyUser', 'anyPassword');
   
    homePage.navigateToConfiguration();
    configPage.navigateToDeploymentMaps();

    deploymentMapPage.clickPlatformServices();
    deploymentMapPage.clickCreateNewServerRole();
    browser.pause(250);
  });

  it('Then I should get a warning if the puppet role is empty for a linux image', function () {
    deploymentMapPage.fillInServerRoleForm('Bonsai', 't2.small', 'ubuntu-16.04-ttl-vanilla', 'AgentService');

    browser.pause(250);
    browser.click('#saveServerRole');

    browser.waitForExist('h2=Linux AMI/Puppet Role Warning');
  });

  it('Then I should not get a warning if the puppet role is empty for a windows image', function () {
    deploymentMapPage.fillInServerRoleForm('Bonsai', 't2.small', 'windows-2012r2-ttl-app', 'AgentService');

    browser.pause(250);
    browser.click('#cancelServerRole');
  });

  it('Then I should see owning team and contact email as required fields', function () {
    const isClusterRequired = browser.getAttribute('select[name=OwningClusters]', 'class').indexOf('ng-invalid-required') > 0;
    const isEmailRequired = browser.getAttribute('input[name=ContactEmail]', 'class').indexOf('ng-invalid-required') > 0;

    assert.equal(isClusterRequired, true);
    assert.equal(isEmailRequired, true);

    browser.pause(250);
    browser.click('#cancelServerRole');
  });

});
