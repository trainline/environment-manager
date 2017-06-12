'use strict'

const expect = require('chai').expect;
const reporting = require('./reporting');

describe('reporting', () => {

  let changeResults, actionGroups, testAccountResults;

  beforeEach(() => {
    actionGroups = {
      skip: [{ action: { action: 'skip', reason: 'some reason' }, instance: { id: 'skipped' }}],
      switchOn: [{ action: { action: 'switchOn', source: 'instance'}, instance: { id: 'switchedOn' }}],
      switchOff: [{ action: { action: 'switchOff', reason: 'some reason', source: 'environment'}, instance: { id: 'switchedOff' }}],
      putInService: [{ action: { action: 'putInService', source: 'instance'}, instance: { id: 'inService' }}],
      putOutOfService: [{ action: { action: 'putOutOfService', reason: 'some reason', source: 'environment'}, instance: { id: 'standBy' }}]
    };

    changeResults = {
      switchOn: {
        success: true
      },
      switchOff: {
        success: true
      },
      putInService: {
        success: true
      },
      putOutOfService: {
        success: true
      }
    };

    testAccountResults = [{ accountName: 'testAccount', details: { actionGroups, changeResults } }];
  });

  it('should report success if all tasks succeeded', () => {
    let report = reporting.createReport(testAccountResults, true);
    expect(report.success).to.equal(true);
  });

  it('should report failure if the switch instance on task failed', () => {
    changeResults.switchOn.success = false;
    let report = reporting.createReport(testAccountResults, true);
    expect(report.success).to.equal(false);
  });

  it('should report failure if the switch instance off task failed', () => {
    changeResults.switchOff.success = false;
    let report = reporting.createReport(testAccountResults, true);
    expect(report.success).to.equal(false);
  });

  it('should report failure if the put instance in service task failed', () => {
    changeResults.putInService.success = false;
    let report = reporting.createReport(testAccountResults, true);
    expect(report.success).to.equal(false);
  });

  it('should report failure if the put in standby task failed', () => {
    changeResults.putOutOfService.success = false;
    let report = reporting.createReport(testAccountResults, true);
    expect(report.success).to.equal(false);
  });

  it('should not show skipped instances if not requested', () => {
    let report = reporting.createReport(testAccountResults, false);
    expect(report.skippedInstances).to.be.undefined;
  });

});