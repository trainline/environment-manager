'use strict';

let proxyquire = require('proxyquire').noCallThru();
let test = require('tape');

function withBatchWrite(batchWrite) {
    return proxyquire('./index', {
        'aws-sdk': {
            DynamoDB: {
                DocumentClient: function () {
                    this.batchWrite = function (request, callback) { process.nextTick(() => batchWrite(request, callback)) };
                }
            }
        },
        console: {
            log() {}
        },
        process: {
            env: {
                DESTINATION_TABLE_NAME: 'MY_TABLE'
            }
        }
    });
}

test('No attempt is made to write the batch of records if it is empty', t => {
    t.plan(0);
    let sut = withBatchWrite(request => t.fail('batchWrite was called'));
    sut.writeItems([]).then(() => t.end()).catch(t.end);
});

test('An attempt is made to write the batch of records if it is not empty', t => {
    t.plan(1);
    let sut = withBatchWrite(request => t.deepEqual(request, {
        RequestItems: {
            'MY_TABLE': [{ 'key': 'a DynamoDB item' }]
        }
    }));
    sut.writeItems([{ 'key': 'a DynamoDB item' }]).then(() => t.end()).catch(t.end);
});

test('If some of the records in the batch are not processed they are re-submitted', t => {
    const callCount = 2;
    t.plan(callCount);
    let batchWriteResponder =(() => {
        let counter = callCount;
        return (request, callback) => {
            counter -= 1;
            if (counter > 0) {
                t.pass('Some unprocessed items returned');
                callback(null, { UnprocessedItems: request.RequestItems });
            } else {
                t.pass('No unprocessed items returned');
                callback(null, null);
            }
        }
    });
    let sut = withBatchWrite(batchWriteResponder());
    sut.writeItems([{ 'key': 'a DynamoDB item' }]).then(() => t.end()).catch(t.end);
});