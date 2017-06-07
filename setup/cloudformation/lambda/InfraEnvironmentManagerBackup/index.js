/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let AWS = require('aws-sdk');
let S3 = new AWS.S3();
let STS = new AWS.STS();
let async = require('async');
let process = require('process');

let S3_BACKUP_BUCKET = process.env.S3_BACKUP_BUCKET;
let S3_PATH = process.env.S3_PATH;
let ROLE_NAME = process.env.ROLE_NAME;

let masterAccount = JSON.parse(process.env.MASTER_ACCOUNT);
masterAccount.tables = JSON.parse(process.env.MASTER_ACCOUNT_TABLES);

let childAccounts = JSON.parse(process.env.CHILD_ACCOUNTS);
let childAccountTables = JSON.parse(process.env.CHILD_ACCOUNT_TABLES);
childAccounts.forEach((account) => { account.tables = childAccountTables; });

let DynamoTables = require('./DynamoTables')(masterAccount, childAccounts, S3_PATH);

let BYTE = 1;
let KB = 1024 * BYTE;
let MB = 1024 * KB;
let S3_MINPARTSIZE = MB * 5;
let NO_ERROR;

function getIAMRoleInTargetAccount(targetAccount) {
  let arn = `arn:aws:iam::${targetAccount.number}:role/${ROLE_NAME}`;

  return arn;
}

function toSize(size) {
  if (size > (100 * KB)) return `${(size / MB).toFixed(2)} MB`;
  if (size > (100 * BYTE)) return `${(size / KB).toFixed(2)} KB`;
  return `${size} Byte`;
}

exports.handler = function (event, context) {
  function backupDynamoTable(dynamoTable, mainCallback) {
    let start = new Date();
    let tableName = dynamoTable.toString();
    let backupFilename = dynamoTable.toBackupFilename();

    console.log('Starting "%s" dynamo table backup', tableName);

    async.waterfall([

      // Each DynamoTable can be in a different AWS account. For this reason the
      // Dynamo client must be created with the assumed credentials for getting
      // records from the target table in the proper AWS account.
      function assumeRoleCredentials(firstLevelCallback) {
        let roleArn = getIAMRoleInTargetAccount(dynamoTable.account);

        console.log('1/5 Assuming role for "%s"', roleArn);

        let stsParams = {
          RoleArn: roleArn,
          RoleSessionName: `${new Date().getTime()}`
        };
        STS.assumeRole(stsParams, firstLevelCallback);
      },

      // First callback argument contains the credentials assumed to work with
      // the target table in the proper AWS account.
      // A new DynamoDB client is created with the assumed credentials and
      // pushed to the next callback in the chain.
      function createDynamoClient(stsResponse, firstLevelCallback) {
        console.log('2/5 Creating DynamoDB client');

        let credentials = new AWS.Credentials(
          stsResponse.Credentials.AccessKeyId,
          stsResponse.Credentials.SecretAccessKey,
          stsResponse.Credentials.SessionToken
        );
        let dynamoClient = new AWS.DynamoDB.DocumentClient({ credentials });
        firstLevelCallback(NO_ERROR, dynamoClient);
      },

      // Dynamo client is now ready so it is time to prepare the S3 object ready
      // for containing the dynamo table stringified content.
      // This callback pushes to the next one the dynamoClient and the UploadId
      // needed for uploading the table content in multiple steps.
      function createMultipartUpload(dynamoClient, firstLevelCallback) {
        let parameters = {
          Bucket: S3_BACKUP_BUCKET,
          Key: backupFilename
        };

        console.log('3/5 Creating multipart upload for "%s/%s" S3 object', S3_BACKUP_BUCKET, backupFilename);

        S3.createMultipartUpload(parameters, (error, s3Response) => {
          if (error) firstLevelCallback(error);
          else firstLevelCallback(NO_ERROR, dynamoClient, s3Response.UploadId);
        });
      },

      // Following callback is itself a chain of callbacks as its purpose is to
      // orchestrating the multipart upload to S3 until there is no longer
      // dynamo records to upload.
      function uploadAllRecordsToS3(dynamoClient, uploadId, firstLevelCallback) {
        let partResults = [];
        let lastKey;
        let buffer = '';

        console.log('4/5 Starting upload records to S3 object.');

        async.doWhilst(

          // Get a chunk of records from dynamo table and upload the content
          // to the S3 preposed object.
          (secondLevelCallback) => {
            async.waterfall([

              // Get a chunk of records from the dynamo table.
              // This function will be repeated changing the 'ExclusiveStartKey'
              // argument in order to scan the whole table chunk after chunk.
              function getRecords(thirdLevelCallback) {
                let request = {
                  TableName: dynamoTable.name,
                  ExclusiveStartKey: lastKey
                };

                dynamoClient.scan(request, (error, data) => {
                  if (error) {
                    // Error occurred. Stop the chain!
                    thirdLevelCallback(error);
                  } else {
                    let records = data.Items;
                    console.log('4/5 Got %d records from DynamoDB', records.length);

                    // Stringifing the table content and pushing it to the next
                    // chain callback for uploading it to S3.
                    lastKey = data.LastEvaluatedKey;
                    let content = dynamoTable.stringify(records);

                    thirdLevelCallback(NO_ERROR, content);
                  }
                });
              },

              // S3 API requires all uploaded part except the last one must have
              // a size greater than 5MB. For this reason following callback
              // ensure to push the content to the next callback only when this
              // requirement is satisfied.
              function bufferizeContent(content, thirdLevelCallback) {
                buffer += buffer.length > 0
                  ? `,\n${content}`
                  : content;

                console.log('4/5 Buffer size %s.', toSize(buffer.length));

                if (buffer.length >= (5 * MB) || lastKey === undefined) {
                  thirdLevelCallback(NO_ERROR, buffer);
                  buffer = '';
                } else {
                  thirdLevelCallback(NO_ERROR, '');
                }
              },

              // Upload the stringified content to the S3 object initialized
              // as multipart upload.
              function uploadRecords(content, thirdLevelCallback) {
                // If no content is provided the callback skips to do its job.
                if (content.length === 0) {
                  thirdLevelCallback();
                  return;
                }

                function getConcatenableContent(content2) {
                  // Content stringified is going to compose a JSON array.
                  // For this reason if this is the first part of the content, the
                  // content itself is prefixed by the array opening character.
                  // Otherwise it is prefixed by a comma to separate this part from
                  // the previous one.
                  // In the same way the content is suffixed with an array closing
                  // character when current part is the latest one.
                  let prefix = (partResults.length === 0) ? '[' : ',\n';
                  let suffix = (lastKey === undefined) ? ']' : '';
                  let result = prefix + content2 + suffix;

                  return result;
                }

                let partNumber = partResults.length + 1;

                console.log('4/5 Uploading part %d [%s]', partNumber, toSize(content.length));

                let parameters = {
                  Bucket: S3_BACKUP_BUCKET,
                  Key: backupFilename,
                  PartNumber: partNumber,
                  UploadId: uploadId,
                  Body: getConcatenableContent(content)
                };

                S3.uploadPart(parameters, (error, s3Response) => {
                  if (error) {
                    thirdLevelCallback(error, uploadId, partResults);
                  } else {
                    partResults.push({ PartNumber: partNumber, ETag: s3Response.ETag });
                    thirdLevelCallback(NO_ERROR);
                  }
                });
              }

            ],

              // Continue the parent callback chain (Second level)
              secondLevelCallback);
          },

          // If 'lastKey' is undefined there is no other dynamo records to read.
          () => {
            return lastKey !== undefined;
          },

          // Continue the parent callback chain (First level)
          (error) => {
            console.log('4/5 Uploaded whole table content.');
            if (error) firstLevelCallback(error, uploadId);
            else firstLevelCallback(NO_ERROR, uploadId, partResults);
          }

        );
      },

      // Following callback finalizes the S3 object in which the dynamo table
      // content has been uploaded.
      function completeMultipartUpload(uploadId, partResults, firstLevelCallback) {
        let parameters = {
          Bucket: S3_BACKUP_BUCKET,
          Key: backupFilename,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: partResults
          }
        };

        console.log('5/5 Completing multipart upload for "%s/%s" S3 object', S3_BACKUP_BUCKET, backupFilename);

        S3.completeMultipartUpload(parameters, (error, s3Response) => {
          if (error) firstLevelCallback(error, uploadId);
          else firstLevelCallback(NO_ERROR);
        });
      }

    ],

      (error) => {
        let elapsedSeconds = (new Date().getTime() - start.getTime()) / 1000;

        if (error) console.log('An error has occurred during "%s" dynamo table backup.', tableName);
        else console.log('"%s" dynamo table successfully backuped in %d seconds.', tableName, elapsedSeconds);

        mainCallback(error);
      });
  }

  let callback = function (error) {
    if (error) context.fail(error);
    else context.succeed();
  };

  async.eachSeries(DynamoTables, backupDynamoTable, callback);
};
