'use strict';

let aws = require('aws-sdk');

module.exports = (name) => {
  const sns = new aws.SNS();
  const valid = /^[a-zA-Z0-9\-\_]+$/;

  console.log(`Creating topic for ${name}`);
  return new Promise((resolve, reject) => {
    if (!name)
      reject('When creating a topic, a name parameter must be provided.');
    if (name.length > 256)
      reject('When creating a topic, a name parameter should be a maximum of 256 characters.');
    if (!valid.test(name))
      reject('When creating a topic, a name parameter must be made up of only uppercase and lowercase ASCII letters, numbers, underscores, and hyphens.');
    
    sns.createTopic({ Name: name }, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};