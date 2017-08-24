'use strict';

const proxyquire = require('proxyquire');
const { test } = require('tap');

let {
  delayP,
  mapSeqP,
  reduceP
} = proxyquire('.', { 'aws-sdk': {} });

function concurrencyCounter() {
  let count = 0;
  let maxCount = 0;
  return {
    countCalls(fn) {
      return (...args) => {
        count += 1;
        if (maxCount < count) { maxCount = count; }
        return fn(...args).then(x => { count -= 1; return x; });
      };
    },
    maxConcurrentCalls() { return maxCount; }
  }
}

function promisify(fn) {
  return (...args) => new Promise((resolve, reject) => {
    function cb(error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    }
    fn(...[...args, cb]);
  });
}

test('delayP returns a promise that resolves', t => {
  return delayP(0).then(x => t.equal(x, undefined));
});

test('reduceP', t => {
  let { countCalls, maxConcurrentCalls } = concurrencyCounter();
  let f = countCalls(([...acc], nxt) => delayP(10).then(() => [...acc, nxt]));
  let init = [];
  let input = [1000, 500, 100];
  let result = reduceP(f, init, input);

  return Promise.all([
    t.test(`executes functions sequentially`, t => {
      return result.then(() => t.equal(maxConcurrentCalls(), 1));
    }),
    t.test(`returns the expected result`, t => {
      return result.then(output => t.equivalent(output, input))
    })
  ]);
});

test('mapSeqP', t => {
  let { countCalls, maxConcurrentCalls } = concurrencyCounter();
  let f = countCalls(x => delayP(10).then(() => x));
  let input = [1000, 500, 100];
  let result = mapSeqP(f, input);

  return Promise.resolve([
    t.test(`executes functions sequentially`, t => {
      return result.then(() => t.equal(maxConcurrentCalls(), 1));
    }),
    t.test(`returns the expected result`, t => {
      return result.then(output => t.equivalent(output, input))
    })
  ]);
});

test('handler', t => {
  class DynamoDB {
    deleteItem(...args) {
      return {
        promise() {
          return Promise.resolve(['deleteItem', ...args]);
        }
      };
    }
    describeTable() {
      return {
        promise() {
          return Promise.resolve({
            Table: {
              KeySchema: [
                {AttributeName: 'Id'},
                {AttributeName: 'Message'}
              ]
            }
          })
        }
      }
    }
    putItem(...args) {
      return {
        promise() {
          return Promise.resolve(['putItem', ...args]);
        }
      };
    }
  }

  let event = {
    "Records": [
      {
        "eventID": "1",
        "eventVersion": "1.0",
        "dynamodb": {
          "Keys": {
            "Id": {
              "N": "101"
            }
          },
          "NewImage": {
            "Audit": {
              "M": {
                "Version": {
                  "N": "1"
                }
              }
            },
            "Message": {
              "S": "New item!"
            },
            "Id": {
              "N": "101"
            }
          },
          "StreamViewType": "NEW_AND_OLD_IMAGES",
          "SequenceNumber": "111",
          "SizeBytes": 26
        },
        "awsRegion": "us-west-2",
        "eventName": "INSERT",
        "eventSourceARN": "arn:aws:dynamodb:us-west-2:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
        "eventSource": "aws:dynamodb"
      },
      {
        "eventID": "2",
        "eventVersion": "1.0",
        "dynamodb": {
          "OldImage": {
            "Message": {
              "S": "New item!"
            },
            "Id": {
              "N": "101"
            }
          },
          "SequenceNumber": "222",
          "Keys": {
            "Id": {
              "N": "101"
            }
          },
          "SizeBytes": 59,
          "NewImage": {
            "Audit": {
              "M": {
                "Version": {
                  "N": "1"
                }
              }
            },
            "Message": {
              "S": "This item has changed"
            },
            "Id": {
              "N": "101"
            }
          },
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "awsRegion": "us-west-2",
        "eventName": "MODIFY",
        "eventSourceARN": "arn:aws:dynamodb:us-west-2:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
        "eventSource": "aws:dynamodb"
      },
      {
        "eventID": "3",
        "eventVersion": "1.0",
        "dynamodb": {
          "Keys": {
            "Id": {
              "N": "101"
            }
          },
          "SizeBytes": 38,
          "SequenceNumber": "333",
          "OldImage": {
            "Audit": {
              "M": {
                "Version": {
                  "N": "1"
                }
              }
            },
            "Message": {
              "S": "This item has changed"
            },
            "Id": {
              "N": "101"
            }
          },
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "awsRegion": "us-west-2",
        "eventName": "REMOVE",
        "eventSourceARN": "arn:aws:dynamodb:us-west-2:account-id:table/ExampleTableWithStream/stream/2015-06-27T00:48:05.899",
        "eventSource": "aws:dynamodb"
      }
    ]
  };

  let { handler } = proxyquire('.', {
    'aws-sdk': { DynamoDB },
    'process': { env: { DESTINATION_TABLE: 'MyTable' } }
  });

  return t.test('performs the expected operations', t => {
    return promisify(handler)(event, null)
      .then(operations => t.equivalent(operations, [
        [
          "putItem",
          {
            "Item": {
              "Id": {
                "N": "101"
              },
              "Audit": {
                "M": {
                  "Version": {
                    "N": "1"
                  }
                }
              },
              "Message": {
                "S": "New item!"
              }
            },
            "TableName": 'MyTable',
            "ConditionExpression": "attribute_not_exists(#hashkey) or #Audit.#Version < :version",
            "ExpressionAttributeNames": {
              "#Audit": "Audit",
              "#hashkey": "Id",
              "#Version": "Version"
            },
            "ExpressionAttributeValues": {
              ":version": {
                "N": "1"
              }
            }
          }
        ],
        [
          "putItem",
          {
            "Item": {
              "Id": {
                "N": "101"
              },
              "Audit": {
                "M": {
                  "Version": {
                    "N": "1"
                  }
                }
              },
              "Message": {
                "S": "This item has changed"
              }
            },
            "TableName": 'MyTable',
            "ConditionExpression": "attribute_not_exists(#hashkey) or #Audit.#Version < :version",
            "ExpressionAttributeNames": {
              "#Audit": "Audit",
              "#hashkey": "Id",
              "#Version": "Version"
            },
            "ExpressionAttributeValues": {
              ":version": {
                "N": "1"
              }
            }
          }
        ],
        [
          "deleteItem",
          {
            "Key": {
              "Id": {
                "N": "101"
              },
              "Message": {
                "S": "This item has changed"
              }
            },
            "TableName": 'MyTable',
            "ConditionExpression": "#Audit.#Version <= :version",
            "ExpressionAttributeNames": {
              "#Audit": "Audit",
              "#Version": "Version"
            },
            "ExpressionAttributeValues": {
              ":version": {
                "N": "1"
              }
            }
          }
        ]
      ]));
  });
});
