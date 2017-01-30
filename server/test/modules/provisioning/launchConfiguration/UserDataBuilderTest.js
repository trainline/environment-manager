/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon = require('sinon');
let rewire = require('rewire');

describe('UserDataBuilder: ', () => {

  let userDataBuilder;
  let rendererMock;

  beforeEach(() => {
    rendererMock = {
      render: sinon.stub().callsArgWith(2, 'content'),
    };
    userDataBuilder = rewire('modules/provisioning/launchConfiguration/UserDataBuilder');
    userDataBuilder.__set__('renderer', rendererMock);
  });

  it('gets encoded windows user data', () => {
    let userData = { Value: 100 };
    return userDataBuilder.buildWindowsUserData(userData).then(result => {
      rendererMock.render.called.should.be.true();
      rendererMock.render.getCall(0).args[0].should.be.equal(userDataBuilder.WINDOWS_USER_DATA_TEMPLATE);
      rendererMock.render.getCall(0).args[1].should.be.deepEqual(userData);
      result.should.be.equal(new Buffer('content').toString('base64'));
    });
  });

  it('gets encoded linux user data', () => {
    let userData = { Value: 100, PuppetRole: '' };
    return userDataBuilder.buildLinuxUserData({ Value: 100 }).then(result => {
      rendererMock.render.called.should.be.true();
      rendererMock.render.getCall(0).args[0].should.be.equal(userDataBuilder.LINUX_USER_DATA_TEMPLATE);
      rendererMock.render.getCall(0).args[1].should.be.deepEqual(userData);
      result.should.be.equal(new Buffer('content').toString('base64'));
    });
  });
});

