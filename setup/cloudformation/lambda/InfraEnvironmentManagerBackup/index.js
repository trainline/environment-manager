/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
/* eslint-disable no-console */

'use strict';

let AWS = require('aws-sdk');
let async = require('async');
let process = require('process');

let { S3_BACKUP_BUCKET, S3_PATH, TABLES } = process.env;

let BYTE = 1;
let KB = 1024 * BYTE;
let MB = 1024 * KB;
let S3_MINPARTSIZE = MB * 5;
let NO_ERROR;

let dynamoClient = new AWS.DynamoDB.DocumentClient();
let S3 = new AWS.S3();

let { getDynamoTableBackupFilename } = (() => {
  function pad(number) {
    return number < 10 ? `0${number}` : number;
  }

  function getDatestamp(date) {
    let result = [
      date.getUTCFullYear(),
      pad(date.getUTCMonth() + 1),
      pad(date.getUTCDate())
    ].join('');

    return result;
  }

  return {
    getDynamoTableBackupFilename(bucketPath, tableName) {
      let datestamp = getDatestamp(new Date());
      return `${bucketPath}/${datestamp}_environmentmanager_${tableName}.json`;
    }
  };
})();

function toSize(size) {
  if (size > (100 * KB)) return `${(size / MB).toFixed(2)} MB`;
  if (size > (100 * BYTE)) return `${(size / KB).toFixed(2)} KB`;
  return `${size} Byte`;
}

exports.handler = (event, context, callback) => {
  function backupDynamoTable(tableName, mainCallback) {
    let start = new Date();
    let backupFilename = getDynamoTableBackupFilename(S3_PATH, tableName);

    console.log(`Starting "${tableName}" dynamo table backup`);

    async.waterfall([
      // Dynamo client is now ready so it is time to prepare the S3 object ready
      // for containing the dynamo table stringified content.
      // This callback pushes to the next one the dynamoClient and the UploadId
      // needed for uploading the table content in multiple steps.
      function createMultipartUpload(firstLevelCallback) {
        let parameters = {
          Bucket: S3_BACKUP_BUCKET,
          Key: backupFilename
        };

        console.log(`1/3 Creating multipart upload for "${S3_BACKUP_BUCKET}/${backupFilename}" S3 object`);

        S3.createMultipartUpload(parameters, (error, s3Response) => {
          if (error) firstLevelCallback(error);
          else firstLevelCallback(NO_ERROR, s3Response.UploadId);
        });
      },

      // Following callback is itself a chain of callbacks as its purpose is to
      // orchestrating the multipart upload to S3 until there is no longer
      // dynamo records to upload.
      function uploadAllRecordsToS3(uploadId, firstLevelCallback) {
        let partResults = [];
        let lastKey;
        let buffer = '';

        console.log('2/3 Starting upload records to S3 object.');

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
                  TableName: tableName,
                  ExclusiveStartKey: lastKey
                };

                dynamoClient.scan(request, (error, data) => {
                  if (error) {
                    // Error occurred. Stop the chain!
                    thirdLevelCallback(error);
                  } else {
                    let records = data.Items;
                    console.log(`2/3 Got ${records.length} records from DynamoDB`);

                    // Stringifing the table content and pushing it to the next
                    // chain callback for uploading it to S3.
                    lastKey = data.LastEvaluatedKey;
                    // remove array delimiters as these records are just a
                    // chunk of a larger array.
                    let content = JSON.stringify(records).slice(1, -1);

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

                console.log(`2/3 Buffer size ${toSize(buffer.length)}`);

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

                console.log(`2/3 Uploading part ${partNumber} ${toSize(content.length)}`);

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
          () => lastKey !== undefined,

          // Continue the parent callback chain (First level)
          (error) => {
            console.log('2/3 Uploaded whole table content.');
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

        console.log('3/3 Completing multipart upload for "%s/%s" S3 object', S3_BACKUP_BUCKET, backupFilename);

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

  let tables = JSON.parse(TABLES);
  async.eachSeries(tables, backupDynamoTable, callback);
};
