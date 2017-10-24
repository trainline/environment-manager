'use strict';

let miniStack = require('../../modules/miniStack');
let path = require('path').posix;
require('should');

let exampleStackTrace = `AwsError: No config/environmenttypes found for EnvironmentType cluster.
    at standardifyError (/opt/environment-manager/modules/resourceFactories/DynamoTableResource.js:270:18)
    at client.get.promise.then.catch (/opt/environment-manager/modules/resourceFactories/DynamoTableResource.js:101:13)
    at tryCatcher (/opt/environment-manager/node_modules/bluebird/js/release/util.js:16:23)
    at Promise._settlePromiseFromHandler(/opt/environment-manager/node_modules/bluebird/js/release/promise.js:510:31)
    at Promise._settlePromise(/opt/environment-manager/node_modules/bluebird/js/release/promise.js:567:18)
    at Promise._settlePromise0(/opt/environment-manager/node_modules/bluebird/js/release/promise.js:612:10)
    at Promise._settlePromises (/opt/environment-manager/node_modules/bluebird/js/release/promise.js:687:18)
    at Async._drainQueue (/opt/environment-manager/node_modules/bluebird/js/release/async.js:138:16)
    at Async._drainQueues(/opt/environment-manager/node_modules/bluebird/js/release/async.js:148:10)
    at Immediate.Async.drainQueues(/opt/environment-manager/node_modules/bluebird/js/release/async.js:17:14)
    at runCallback (timers.js:637:20)
    at tryOnImmediate(timers.js:610:5)
    at processImmediate [as _immediateCallback] (timers.js:582:5)`;

describe('miniStack', function () {
  context('removes lines from third party modules', function () {
    let mini = miniStack({ contextLines: 1, filePathTransform: x => x });
    it('when the stack trace is empty', function () {
      let input = '';
      let expected = '';
      mini(input).should.be.eql(expected);
    });
    it('when the stack trace is has only my modules', function () {
      let input = `Error
        at myFunction (/opt/environment-manager/mine.js:1:1)`;
      let expected = 'myFunction (/opt/environment-manager/mine.js:1:1)';
      mini(input).should.be.eql(expected);
    });
    it('when the stack trace is has only their modules', function () {
      let input = `Error
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)`;
      let expected = 'theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)';
      mini(input).should.be.eql(expected);
    });
    it('shows their module when it is just above my module in the stack', function () {
      let input = `Error
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
        at myFunction (/opt/environment-manager/mine.js:1:1)`;
      let expected =
`theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
myFunction (/opt/environment-manager/mine.js:1:1)`;
      mini(input).should.be.eql(expected);
    });
    it('shows their module when it is just below my module in the stack', function () {
      let input = `Error
        at myFunction (/opt/environment-manager/mine.js:1:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)`;
      let expected =
`myFunction (/opt/environment-manager/mine.js:1:1)
theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)`;
      mini(input).should.be.eql(expected);
    });
    it('shows their module when it is at the bottom of the stack', function () {
      let input = `Error
        at myFunction (/opt/environment-manager/mine.js:1:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:2:1)`;
      let expected =
`myFunction (/opt/environment-manager/mine.js:1:1)
theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
theirFunction (/opt/environment-manager/node_modules/theirs.js:2:1)`;
      mini(input).should.be.eql(expected);
    });
    it('shows a message when their modules are filtered out', function () {
      let input = `Error
        at myFunction (/opt/environment-manager/mine.js:1:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
        at myFunction (/opt/environment-manager/mine.js:1:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:2:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:3:1)
        `;
      let expected =
`myFunction (/opt/environment-manager/mine.js:1:1)
theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
myFunction (/opt/environment-manager/mine.js:1:1)
theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
...(1 line skipped)...
theirFunction (/opt/environment-manager/node_modules/theirs.js:3:1)`;
      mini(input).should.be.eql(expected);
    });
    it('shows my module when it is at the bottom of the stack', function () {
      let input = `Error
        at myFunction (/opt/environment-manager/mine.js:1:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
        at myFunction (/opt/environment-manager/mine.js:2:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:2:1)
From previous event:
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:3:1)
        at myFunction (/opt/environment-manager/mine.js:3:1)`;
      let expected =
`myFunction (/opt/environment-manager/mine.js:1:1)
theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
myFunction (/opt/environment-manager/mine.js:2:1)
theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
...(1 line skipped)...
theirFunction (/opt/environment-manager/node_modules/theirs.js:3:1)
myFunction (/opt/environment-manager/mine.js:3:1)`;
      mini(input).should.be.eql(expected);
    });
    it('works on a realistic example', function () {
      mini(exampleStackTrace).should.be.eql(
`standardifyError (/opt/environment-manager/modules/resourceFactories/DynamoTableResource.js:270:18)
client.get.promise.then.catch (/opt/environment-manager/modules/resourceFactories/DynamoTableResource.js:101:13)
tryCatcher (/opt/environment-manager/node_modules/bluebird/js/release/util.js:16:23)
...(9 lines skipped)...
processImmediate [as _immediateCallback] (timers.js:582:5)`);
    });
  });
  context('displays no context lines', function () {
    it('shows only my modules', function () {
      let mini = miniStack({ contextLines: 0, filePathTransform: x => x });
      let input = `Error
        at myFunction (/opt/environment-manager/mine.js:1:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
        at myFunction (/opt/environment-manager/mine.js:2:1)
        at next (native)`;
      let expected =
`myFunction (/opt/environment-manager/mine.js:1:1)
...(1 line skipped)...
myFunction (/opt/environment-manager/mine.js:2:1)`;
      mini(input).should.be.eql(expected);
    });
  });
  context('shortens file paths', function () {
        // let basePath = require.resolve('package.json');
    let basePath = '/opt/environment-manager';
    let filePathTransform = fullPath => path.posix.relative(basePath, fullPath);
    let mini = miniStack({ contextLines: 1, filePathTransform });
    it('shows a message when their modules are filtered out', function () {
      let input = `Error
        at myFunction (/opt/environment-manager/mine.js:1:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
        at myFunction (/opt/environment-manager/mine.js:1:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:1:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:2:1)
        at theirFunction (/opt/environment-manager/node_modules/theirs.js:3:1)
        `;
      let expected =
`myFunction (mine.js:1:1)
theirFunction (node_modules/theirs.js:1:1)
myFunction (mine.js:1:1)
theirFunction (node_modules/theirs.js:1:1)
...(1 line skipped)...
theirFunction (node_modules/theirs.js:3:1)`;
      mini(input).should.be.eql(expected);
    });
  });
});
