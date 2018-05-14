/* eslint-disable */

module.exports = {
  clickPlatformServices: () => {
    browser.waitForExist('a=PlatformServices');
    browser.pause(250);
    
    browser.click('a=PlatformServices');
  },
  clickCreateNewServerRole: () => {
    browser.waitForExist('#createNewServerRole');
    browser.pause(250);
    browser.click('#createNewServerRole');
  },
  fillInServerRoleForm: (clusterName, instanceType, amiType, serviceName) => {
    // Server Role
    browser.waitForExist('input[name=ServerRoleName]');
    browser.pause(250);

    browser.setValue('input[name=ServerRoleName]', 'anyRoleName');
    browser.selectByVisibleText('select[name=OwningClusters]', clusterName);

    // Infrastructure Settings
    browser.click('a=Infrastructure Settings');
    browser.selectByVisibleText('select[name=InstanceType]', instanceType);
    browser.click('#selectAMI');

    browser.waitForExist('select[name=AmiType]');
    browser.pause(250);

    browser.selectByVisibleText('select[name=AmiType]', amiType);
    browser.click('#confirmAMI');
    browser.setValue('input[name=InstanceProfileName]', 'anyInstanceProfile');
    browser.setValue('input[name=SecurityGroups]', 'anySecurityGroups');
    browser.setValue('input[name=PuppetRole]', '');
    
    // Services
    browser.click('a=Services');

    browser.waitForExist('select[name=NewService]');
    browser.pause(250);

    browser.selectByVisibleText('select[name=NewService]', serviceName);
    browser.click('#addService');
  }
};