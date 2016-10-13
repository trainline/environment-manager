'use strict'

const expect = require('chai').expect;
const reporting = require('./reporting');

describe('reporting', () => {

  let actionGroups, changeResults;

  beforeEach(() => {
    actionGroups = {
      skip: [{ action: { action: 'skip', reason: 'some reason' }, instance: { InstanceId: 'skipped' }}],
      switchOn: [{ action: { action: 'switchOn', source: 'instance'}, instance: { InstanceId: 'switchedOn' }}],
      switchOff: [{ action: { action: 'switchOff', reason: 'some reason', source: 'environment'}, instance: { InstanceId: 'switchedOff' }}]
    };

    changeResults = {
      switchOn: {
        success: true
      },
      switchOff: {
        success: true
      }
    }
  });

  it('should display a report of changes and skipped instances', () => {

    let report = reporting.createReport({ actionGroups, changeResults }, true);

    expect(report).to.deep.equal({
      success: true,
      switchOn: {
        result: {
          success: true
        },
        instances: [
          {
            instance: {
              id: "switchedOn",
              name: undefined,
              role: undefined
            },
            reason: undefined,
            source: 'instance'
          }
        ]
      },
      switchOff: {
        result: {
          success: true
        },
        instances: [
          {
            instance: {
              id: "switchedOff",
              name: undefined,
              role: undefined
            },
            reason: 'some reason',
            source: 'environment'
          }
        ]
      },
      skippedInstances: [
        {
          instance: {
            id: "skipped",
            name: undefined,
            role: undefined
          },
          reason: 'some reason',
          source: undefined
        }
      ]
    });

  });

  it('should report failure if the switch instance on task failed', () => {
    changeResults.switchOn.success = false;
    let report = reporting.createReport({ actionGroups, changeResults }, true);
    expect(report.success).to.equal(false);
  });

  it('should report failure if the switch instance off task failed', () => {
    changeResults.switchOff.success = false;
    let report = reporting.createReport({ actionGroups, changeResults }, true);
    expect(report.success).to.equal(false);
  });

  it('should not show skipped instances if not requested', () => {
    let report = reporting.createReport({ actionGroups, changeResults }, false);
    expect(report.skippedInstances).to.be.undefined;
  });

});