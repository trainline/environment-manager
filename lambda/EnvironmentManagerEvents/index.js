/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const AWS = require("aws-sdk");

const TOPIC_PARAMETERS = {
    Configuration: {
        Name: 'EnvironmentManagerConfigurationChange'
    },
    Operations: {
        Name: 'EnvironmentManagerOperationsChange'
    }
};

const MESSAGES = {
    OperationsChange: 'Environment Manager Operations Change',
    ConfigurationChange: 'Environment Manager Configuration Change'
};

function createWellFormedResponse() {
    return {
        "statusCode": 200, // assume success from the beginning.
        "headers": {},
        "body": JSON.stringify('') // body must be a string.
    };
}

exports.configurationChange = function (event, context) {
    const sns = new AWS.SNS();
    const response = createWellFormedResponse();
    const attributes = event.Attributes || {};

    sns.createTopic(TOPIC_PARAMETERS.Configuration, (err, ResponseMetadata) => {
        if (err) {
            response.status = 500;
            response.body = JSON.stringify(err);
            context.fail(response);
        }
        // Now we have the topic arn, based off of the name value, we can publish to it!
        sns.publish({
            TargetArn: ResponseMetadata.TopicArn,
            Message: MESSAGES.ConfigurationChange,
            MessageAttributes: attributes
        }, (err, result) => {
            if (err) {
                response.statusCode = 500;
                response.body = JSON.stringify(err);
                context.fail(response);
            }

            response.body = JSON.stringify(result);
            context.succeed(response);
        });
    });
};

exports.operationsChange = function (event, context) {
    const sns = new AWS.SNS();
    const response = createWellFormedResponse();
    const attributes = event.Attributes || {};

    sns.createTopic(TOPIC_PARAMETERS.Operations, (err, ResponseMetadata) => {
        if (err) {
            response.status = 500;
            response.body = JSON.stringify(err);
            context.fail(response);
        }
        // Now we have the topic arn, based off of the name value, we can publish to it!
        sns.publish({
            TargetArn: ResponseMetadata.TopicArn,
            Message: MESSAGES.OperationsChange,
            MessageAttributes: attributes
        }, (err, result) => {
            if (err) {
                response.statusCode = 500;
                response.body = JSON.stringify(err);
                context.fail(response);
            }

            response.body = JSON.stringify(result);
            context.succeed(response);
        });
    });
};

