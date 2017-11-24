'use strict';

const inject = require('inject-loader!../../../modules/queryHandlersUtil/scanCrossAccountFn');
require('should');

function createFixture() {
  return inject({
    '../awsAccounts': {
      all: () => Promise.resolve([
        { AccountName: 'one', AccountNumber: '1' },
        { AccountName: 'two', AccountNumber: '2' }])
    }
  });
}

describe('scanCrossAccountFn', function () {
  it('it applies the function to each account and concatenates the results', function () {
    const sut = createFixture();
    const probe = ({ AccountNumber }) => ['A', 'B'].map(i => `${AccountNumber}.${i}`);
    return sut(probe).should.finally.eql(['1.A', '1.B', '2.A', '2.B']);
  });
  context('when the result items are objects', function () {
    it('it sets the AccountName property on each result item', function () {
      const sut = createFixture();
      const probe = ({ AccountNumber }) => ['A', 'B'].map(j => ({ i: AccountNumber, j }));
      return sut(probe).should.finally.eql([
        { i: '1', j: 'A', AccountName: 'one' },
        { i: '1', j: 'B', AccountName: 'one' },
        { i: '2', j: 'A', AccountName: 'two' },
        { i: '2', j: 'B', AccountName: 'two' }
      ]);
    });
  });
});
