'use strict';

let {
    dependsOnSeq,
    streamArn,
    triggerAll
} = require('./template');

module.exports = function ({ managedAccounts }) {

    managedAccounts = Array.from(new Set(managedAccounts || []));

    function trigger(functionName, sourceArn) {
        return Object.assign({ "Condition": "ThisIsMasterAccount" }, triggerAll(functionName, sourceArn));
    }

    return {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Description": "Environment Manager Resources",
        "Parameters": {
            "pMasterAccountId": {
                "Type": "String",
                "Description": "Master AWS account ID",
                "AllowedPattern": "[0-9]{12}"
            },
            "pAlertSNSTopic": {
                "Type": "String",
                "Description": "SNS Topic ARN for lambda alerts."
            }
        },
        "Conditions": {
            "ThisIsMasterAccount": {
                "Fn::Equals": [
                    {
                        "Ref": "pMasterAccountId"
                    },
                    {
                        "Ref": "AWS::AccountId"
                    }
                ]
            },
            "ThisIsNotMasterAccount": {
                "Fn::Not": [
                    {
                        "Fn::Equals": [
                            {
                                "Ref": "pMasterAccountId"
                            },
                            {
                                "Ref": "AWS::AccountId"
                            }
                        ]
                    }
                ]
            }
        },
        "Resources": Object.assign(dependsOnSeq({
            "ConfigEnvironments": {
                "Type": "AWS::DynamoDB::Table",
                "Condition": "ThisIsMasterAccount",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "EnvironmentName",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "EnvironmentName",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": "ConfigEnvironments"
                }
            },
            "AlertReadCapacityConfigEnvironments": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "AlertReadCapacityConfigEnvironments",
                    "AlarmName": "AlertReadCapacityConfigEnvironments",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigEnvironments" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigEnvironments": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "AlertWriteCapacityConfigEnvironments",
                    "AlarmName": "AlertWriteCapacityConfigEnvironments",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigEnvironments" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "ConfigServices": {
                "Type": "AWS::DynamoDB::Table",
                "Condition": "ThisIsMasterAccount",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "ServiceName",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "OwningCluster",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "ServiceName",
                            "KeyType": "HASH"
                        },
                        {
                            "AttributeName": "OwningCluster",
                            "KeyType": "RANGE"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": "ConfigServices"
                }
            },
            "AlertReadCapacityConfigServices": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityConfigServices",
                    "AlarmName": "AlertReadCapacityConfigServices",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigServices" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigServices": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityConfigServices",
                    "AlarmName": "AlertWriteCapacityConfigServices",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigServices" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "ConfigDeploymentMaps": {
                "Type": "AWS::DynamoDB::Table",
                "Condition": "ThisIsMasterAccount",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "DeploymentMapName",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "DeploymentMapName",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": "ConfigDeploymentMaps"
                }
            },
            "AlertReadCapacityConfigDeploymentMaps": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityConfigDeploymentMaps",
                    "AlarmName": "AlertReadCapacityConfigDeploymentMaps",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigDeploymentMaps" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigDeploymentMaps": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityConfigDeploymentMaps",
                    "AlarmName": "AlertWriteCapacityConfigDeploymentMaps",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigDeploymentMaps" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "ConfigLBSettings": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "EnvironmentName",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "VHostName",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "EnvironmentName",
                            "KeyType": "HASH"
                        },
                        {
                            "AttributeName": "VHostName",
                            "KeyType": "RANGE"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": "ConfigLBSettings"
                }
            },
            "AlertReadCapacityConfigLBSettings": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityConfigLBSettings",
                    "AlarmName": "AlertReadCapacityConfigLBSettings",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigLBSettings" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigLBSettings": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityConfigLBSettings",
                    "AlarmName": "AlertWriteCapacityConfigLBSettings",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigLBSettings" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "ConfigLBUpstream": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "key",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "key",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": "ConfigLBUpstream"
                }
            },
            "AlertReadCapacityConfigLBUpstream": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityConfigLBUpstream",
                    "AlarmName": "AlertReadCapacityConfigLBUpstream",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigLBUpstream" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigLBUpstream": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityConfigLBUpstream",
                    "AlarmName": "AlertWriteCapacityConfigLBUpstream",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigLBUpstream" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "ConfigNotificationSettings": {
                "Type": "AWS::DynamoDB::Table",
                "Condition": "ThisIsMasterAccount",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "NotificationSettingsId",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "NotificationSettingsId",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": "ConfigNotificationSettings"
                }
            },
            "AlertReadCapacityConfigNotificationSettings": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityConfigNotificationSettings",
                    "AlarmName": "AlertReadCapacityConfigNotificationSettings",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigNotificationSettings" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigNotificationSettings": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityConfigNotificationSettings",
                    "AlarmName": "AlertWriteCapacityConfigNotificationSettings",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigNotificationSettings" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "ConfigDeploymentExecutionStatus": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "DeploymentID",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "DeploymentID",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "TableName": "ConfigDeploymentExecutionStatus"
                }
            },
            "AlertReadCapacityConfigDeploymentExecutionStatus": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityConfigDeploymentExecutionStatus",
                    "AlarmName": "AlertReadCapacityConfigDeploymentExecutionStatus",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigDeploymentExecutionStatus" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigDeploymentExecutionStatus": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityConfigDeploymentExecutionStatus",
                    "AlarmName": "AlertWriteCapacityConfigDeploymentExecutionStatus",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigDeploymentExecutionStatus" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "ConfigCompletedDeployments": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "DeploymentID",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "StartTimestamp",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "StartDate",
                            "AttributeType": "S"
                        }
                    ],
                    "GlobalSecondaryIndexes": [
                        {
                            "IndexName": "StartDate-StartTimestamp-index",
                            "KeySchema": [
                                {
                                    "AttributeName": "StartDate",
                                    "KeyType": "HASH"
                                },
                                {
                                    "AttributeName": "StartTimestamp",
                                    "KeyType": "RANGE"
                                }
                            ],
                            "Projection": {
                                "ProjectionType": "ALL"
                            },
                            "ProvisionedThroughput": {
                                "ReadCapacityUnits": 10,
                                "WriteCapacityUnits": 2
                            }
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "DeploymentID",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "TableName": "ConfigCompletedDeployments"
                }
            },
            "AlertReadCapacityConfigCompletedDeployments": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityConfigCompletedDeployments",
                    "AlarmName": "AlertReadCapacityConfigCompletedDeployments",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigCompletedDeployments" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigCompletedDeployments": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityConfigCompletedDeployments",
                    "AlarmName": "AlertWriteCapacityConfigCompletedDeployments",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigCompletedDeployments" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "ConfigEnvironmentTypes": {
                "Type": "AWS::DynamoDB::Table",
                "Condition": "ThisIsMasterAccount",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "EnvironmentType",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "EnvironmentType",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": "ConfigEnvironmentTypes"
                }
            },
            "AlertReadCapacityConfigEnvironmentTypes": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityConfigEnvironmentTypes",
                    "AlarmName": "AlertReadCapacityConfigEnvironmentTypes",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigEnvironmentTypes" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityConfigEnvironmentTypes": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityConfigEnvironmentTypes",
                    "AlarmName": "AlertWriteCapacityConfigEnvironmentTypes",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "ConfigEnvironmentTypes" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraAsgIPs": {
                "Type": "AWS::DynamoDB::Table",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "AsgName",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "AsgName",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "TableName": "InfraAsgIPs"
                }
            },
            "AlertReadCapacityInfraAsgIPs": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraAsgIPs",
                    "AlarmName": "AlertReadCapacityInfraAsgIPs",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraAsgIPs" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraAsgIPs": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraAsgIPs",
                    "AlarmName": "AlertWriteCapacityInfraAsgIPs",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraAsgIPs" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraChangeAudit": {
                "Type": "AWS::DynamoDB::Table",
                "Condition": "ThisIsMasterAccount",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "AuditID",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "Date",
                            "AttributeType": "S"
                        },
                        {
                            "AttributeName": "ISOTimestamp",
                            "AttributeType": "S"
                        }
                    ],
                    "GlobalSecondaryIndexes": [
                        {
                            "IndexName": "Date-ISOTimestamp-index",
                            "KeySchema": [
                                {
                                    "AttributeName": "Date",
                                    "KeyType": "HASH"
                                },
                                {
                                    "AttributeName": "ISOTimestamp",
                                    "KeyType": "RANGE"
                                }
                            ],
                            "Projection": {
                                "ProjectionType": "ALL"
                            },
                            "ProvisionedThroughput": {
                                "ReadCapacityUnits": 10,
                                "WriteCapacityUnits": 5
                            }
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "AuditID",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 20,
                        "WriteCapacityUnits": 5
                    },
                    "TableName": "InfraChangeAudit"
                }
            },
            "AlertReadCapacityInfraChangeAudit": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraChangeAudit",
                    "AlarmName": "AlertReadCapacityInfraChangeAudit",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraChangeAudit" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraChangeAudit": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraChangeAudit",
                    "AlarmName": "AlertWriteCapacityInfraChangeAudit",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraChangeAudit" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraConfigAccounts": {
                "Type": "AWS::DynamoDB::Table",
                "Condition": "ThisIsMasterAccount",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "AccountNumber",
                            "AttributeType": "N"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "AccountNumber",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": "InfraConfigAccounts"
                }
            },
            "AlertReadCapacityInfraConfigAccounts": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraConfigAccounts",
                    "AlarmName": "AlertReadCapacityInfraConfigAccounts",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraConfigAccounts" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraConfigAccounts": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraConfigAccounts",
                    "AlarmName": "AlertWriteCapacityInfraConfigAccounts",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraConfigAccounts" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraConfigClusters": {
                "Type": "AWS::DynamoDB::Table",
                "Condition": "ThisIsMasterAccount",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "ClusterName",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "ClusterName",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": "InfraConfigClusters"
                }
            },
            "AlertReadCapacityInfraConfigClusters": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraConfigClusters",
                    "AlarmName": "AlertReadCapacityInfraConfigClusters",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraConfigClusters" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraConfigClusters": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraConfigClusters",
                    "AlarmName": "AlertWriteCapacityInfraConfigClusters",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraConfigClusters" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraConfigPermissions": {
                "Type": "AWS::DynamoDB::Table",
                "Condition": "ThisIsMasterAccount",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "Name",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "Name",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": "InfraConfigPermissions"
                }
            },
            "AlertReadCapacityInfraConfigPermissions": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraConfigPermissions",
                    "AlarmName": "AlertReadCapacityInfraConfigPermissions",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraConfigPermissions" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraConfigPermissions": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraConfigPermissions",
                    "AlarmName": "AlertWriteCapacityInfraConfigPermissions",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraConfigPermissions" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraEnvManagerSessions": {
                "Type": "AWS::DynamoDB::Table",
                "Condition": "ThisIsMasterAccount",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "UserName",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "UserName",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "TableName": "InfraEnvManagerSessions"
                }
            },
            "AlertReadCapacityInfraEnvManagerSessions": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraEnvManagerSessions",
                    "AlarmName": "AlertReadCapacityInfraEnvManagerSessions",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraEnvManagerSessions" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraEnvManagerSessions": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraEnvManagerSessions",
                    "AlarmName": "AlertWriteCapacityInfraEnvManagerSessions",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraEnvManagerSessions" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            },
            "InfraOpsEnvironment": {
                "Type": "AWS::DynamoDB::Table",
                "Condition": "ThisIsMasterAccount",
                "Properties": {
                    "AttributeDefinitions": [
                        {
                            "AttributeName": "EnvironmentName",
                            "AttributeType": "S"
                        }
                    ],
                    "KeySchema": [
                        {
                            "AttributeName": "EnvironmentName",
                            "KeyType": "HASH"
                        }
                    ],
                    "ProvisionedThroughput": {
                        "ReadCapacityUnits": 10,
                        "WriteCapacityUnits": 2
                    },
                    "StreamSpecification": {
                        "StreamViewType": "NEW_AND_OLD_IMAGES"
                    },
                    "TableName": "InfraOpsEnvironment"
                }
            },
            "AlertReadCapacityInfraOpsEnvironment": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "ReadCapacityInfraOpsEnvironment",
                    "AlarmName": "AlertReadCapacityInfraOpsEnvironment",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraOpsEnvironment" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedReadCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 8
                }
            },
            "AlertWriteCapacityInfraOpsEnvironment": {
                "Type": "AWS::CloudWatch::Alarm",
                "Properties": {
                    "ActionsEnabled": true,
                    "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                    "AlarmDescription": "WriteCapacityInfraOpsEnvironment",
                    "AlarmName": "AlertWriteCapacityInfraOpsEnvironment",
                    "ComparisonOperator": "GreaterThanThreshold",
                    "Dimensions": [{ "Name": "TableName", "Value": "InfraOpsEnvironment" }],
                    "EvaluationPeriods": 1,
                    // "InsufficientDataActions": [""]
                    "MetricName": "ConsumedWriteCapacityUnits",
                    "Namespace": "AWS/DynamoDB",
                    // "OKActions": [""]
                    "Period": 60,
                    "Statistic": "Sum",
                    "Threshold": 1.6
                }
            }
        }), {
                "lambdaInfraEnvironmentManagerAudit": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "Code": "./lambda/InfraEnvironmentManagerAudit/infra-environment-manager-audit.zip",
                        "Description": "This function responds to a DynamoDB stream event by writing the value of each record before and after the change to an audit log.",
                        "FunctionName": "InfraEnvironmentManagerAudit",
                        "Handler": "index.handler",
                        "MemorySize": 128,
                        "Role": {
                            "Fn::GetAtt": [
                                "roleInfraEnvironmentManagerAudit",
                                "Arn"
                            ]
                        },
                        "Runtime": "nodejs4.3",
                        "Timeout": 3
                    }
                },
                "alertInfraEnvironmentManagerAudit": {
                    "Type": "AWS::CloudWatch::Alarm",
                    "Properties": {
                        "ActionsEnabled": true,
                        "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                        "AlarmDescription": "If there is an error in this lambda, report to SNS topic.",
                        "AlarmName": "alertInfraEnvironmentManagerAudit",
                        "ComparisonOperator": "GreaterThanThreshold",
                        "EvaluationPeriods": 1,
                        "MetricName": "Errors",
                        "Namespace": "AWS/Lambda",
                        "Dimensions": [
                            {
                                "Name": "FunctionName",
                                "Value": "InfraEnvironmentManagerAudit"
                            }
                        ],
                        "Period": 60,
                        "Statistic": "Sum",
                        "Threshold": 0
                    }
                },
                "roleInfraEnvironmentManagerAudit": {
                    "Type": "AWS::IAM::Role",
                    "Properties": {
                        "AssumeRolePolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Principal": {
                                        "Service": "lambda.amazonaws.com"
                                    },
                                    "Action": "sts:AssumeRole"
                                }
                            ]
                        },
                        "ManagedPolicyArns": [
                            "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
                        ],
                        "Policies": [
                            {
                                "PolicyName": "roleInfraEnvironmentManagerAuditPolicy",
                                "PolicyDocument": {
                                    "Version": "2012-10-17",
                                    "Statement": [
                                        {
                                            "Effect": "Allow",
                                            "Action": [
                                                "dynamodb:GetRecords",
                                                "dynamodb:GetShardIterator",
                                                "dynamodb:DescribeStream",
                                                "dynamodb:ListStreams"
                                            ],
                                            "Resource": [
                                                'ConfigLBSettings',
                                                'ConfigLBUpstream',
                                                'ConfigServices',
                                                'InfraConfigClusters',
                                                'ConfigEnvironments',
                                                'InfraConfigPermissions',
                                                'ConfigEnvironmentTypes',
                                                'ConfigDeploymentMaps',
                                                'InfraConfigAccounts',
                                                'ConfigNotificationSettings'
                                            ].map(streamArn)
                                        },
                                        {
                                            "Action": "sts:AssumeRole",
                                            "Effect": "Allow",
                                            "Resource": [
                                                {
                                                    "Fn::Sub": "arn:aws:iam::${pMasterAccountId}:role/roleInfraEnvironmentManagerAuditWriter"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                "auditTriggerConfigLBSettings": triggerAll('lambdaInfraEnvironmentManagerAudit', streamArn('ConfigLBSettings')),
                "auditTriggerConfigLBUpstream": triggerAll('lambdaInfraEnvironmentManagerAudit', streamArn('ConfigLBUpstream')),
                "auditTriggerConfigServices": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('ConfigServices')),
                "auditTriggerInfraConfigClusters": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('InfraConfigClusters')),
                "auditTriggerConfigEnvironments": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('ConfigEnvironments')),
                "auditTriggerInfraConfigPermissions": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('InfraConfigPermissions')),
                "auditTriggerConfigEnvironmentTypes": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('ConfigEnvironmentTypes')),
                "auditTriggerConfigDeploymentMaps": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('ConfigDeploymentMaps')),
                "auditTriggerInfraConfigAccounts": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('InfraConfigAccounts')),
                "auditTriggerConfigNotificationSettings": trigger('lambdaInfraEnvironmentManagerAudit', streamArn('ConfigNotificationSettings')),
                "roleInfraEnvironmentManagerAuditWriter": {
                    "Type": "AWS::IAM::Role",
                    "Condition": "ThisIsMasterAccount",
                    "Properties": {
                        "AssumeRolePolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Sid": "",
                                    "Effect": "Allow",
                                    "Principal": {
                                        "AWS": [
                                            {
                                                "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                                            }
                                        ].concat(managedAccounts.map(accountNumber => `arn:aws:iam::${accountNumber}:root`))
                                    },
                                    "Action": "sts:AssumeRole"
                                }
                            ]
                        },
                        "ManagedPolicyArns": [
                            "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
                        ],
                        "Policies": [
                            {
                                "PolicyName": "roleInfraEnvironmentManagerAuditWriterPolicy",
                                "PolicyDocument": {
                                    "Version": "2012-10-17",
                                    "Statement": [
                                        {
                                            "Effect": "Allow",
                                            "Action": [
                                                "dynamodb:BatchWriteItem",
                                                "dynamodb:PutItem"
                                            ],
                                            "Resource": [
                                                {
                                                    "Fn::Sub": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${InfraChangeAudit}"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        ],
                        "RoleName": "roleInfraEnvironmentManagerAuditWriter"
                    }
                },
                "lambdaInfraAsgScale": {
                    "Type": "AWS::Lambda::Function",
                    "Properties": {
                        "Code": "./lambda/InfraAsgLambdaScale/infraAsgLambdaScale.zip",
                        "Description": "This function scales auto scaling groups.",
                        "FunctionName": "InfraAsgScale",
                        "Handler": "index.handler",
                        "MemorySize": 128,
                        "Role": {
                            "Fn::GetAtt": [
                                "roleInfraAsgScale",
                                "Arn"
                            ]
                        },
                        "Runtime": "nodejs4.3",
                        "Timeout": 30
                    }
                },
                "alertInfraAsgScale": {
                    "Type": "AWS::CloudWatch::Alarm",
                    "Properties": {
                        "ActionsEnabled": true,
                        "AlarmActions": [{ "Ref": "pAlertSNSTopic" }],
                        "AlarmDescription": "If there is an error in this lambda, report to SNS topic.",
                        "AlarmName": "alertInfraAsgScale",
                        "ComparisonOperator": "GreaterThanThreshold",
                        "EvaluationPeriods": 1,
                        "MetricName": "Errors",
                        "Namespace": "AWS/Lambda",
                        "Dimensions": [
                            {
                                "Name": "FunctionName",
                                "Value": "InfraAsgScale"
                            }
                        ],
                        "Period": 60,
                        "Statistic": "Sum",
                        "Threshold": 0
                    }
                },
                "snsInfraAsgScale": {
                    "Type": "AWS::SNS::Topic",
                    "DependsOn": [
                        "lambdaInfraAsgScale"
                    ],
                    "Properties": {
                        "Subscription": [
                            {
                                "Endpoint": {
                                    "Fn::GetAtt": [
                                        "lambdaInfraAsgScale",
                                        "Arn"
                                    ]
                                },
                                "Protocol": "lambda"
                            }
                        ],
                        "TopicName": "InfraAsgLambdaScale"
                    }
                },
                "lambdaPermissionInfraAsgScale": {
                    "Type": "AWS::Lambda::Permission",
                    "Properties": {
                        "Action": "lambda:InvokeFunction",
                        "Principal": "sns.amazonaws.com",
                        "SourceArn": {
                            "Ref": "snsInfraAsgScale"
                        },
                        "FunctionName": {
                            "Fn::GetAtt": [
                                "lambdaInfraAsgScale",
                                "Arn"
                            ]
                        }
                    }
                },
                "roleInfraAsgScale": {
                    "Type": "AWS::IAM::Role",
                    "Properties": {
                        "AssumeRolePolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Principal": {
                                        "Service": "lambda.amazonaws.com"
                                    },
                                    "Action": "sts:AssumeRole"
                                }
                            ]
                        },
                        "ManagedPolicyArns": [
                            "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
                        ],
                        "Policies": [
                            {
                                "PolicyName": "roleInfraAsgScalePolicy",
                                "PolicyDocument": {
                                    "Version": "2012-10-17",
                                    "Statement": [
                                        {
                                            "Effect": "Allow",
                                            "Action": [
                                                "ec2:Describe*",
                                                "ec2:DeleteVolume",
                                                "ec2:RunInstances",
                                                "ec2:StartInstances",
                                                "ec2:StopInstances",
                                                "ec2:TerminateInstances",
                                                "ec2:UnmonitorInstances"
                                            ],
                                            "Resource": [
                                                "*"
                                            ]
                                        },
                                        {
                                            "Effect": "Allow",
                                            "Action": "elasticloadbalancing:Describe*",
                                            "Resource": "*"
                                        },
                                        {
                                            "Effect": "Allow",
                                            "Action": [
                                                "cloudwatch:ListMetrics",
                                                "cloudwatch:GetMetricStatistics",
                                                "cloudwatch:Describe*"
                                            ],
                                            "Resource": "*"
                                        },
                                        {
                                            "Effect": "Allow",
                                            "Action": [
                                                "autoscaling:Describe*",
                                                "autoscaling:PutLifecycleHook",
                                                "autoscaling:ResumeProcesses",
                                                "autoscaling:SuspendProcesses",
                                                "autoscaling:CreateOrUpdateScalingTrigger",
                                                "autoscaling:CreateOrUpdateTags",
                                                "autoscaling:DeleteAutoScalingGroup",
                                                "autoscaling:PutScalingPolicy",
                                                "autoscaling:PutScheduledUpdateGroupAction",
                                                "autoscaling:PutNotificationConfiguration",
                                                "autoscaling:SetDesiredCapacity",
                                                "autoscaling:SuspendProcesses",
                                                "autoscaling:TerminateInstanceInAutoScalingGroup",
                                                "autoscaling:UpdateAutoScalingGroup"
                                            ],
                                            "Resource": [
                                                "*"
                                            ]
                                        },
                                        {
                                            "Effect": "Allow",
                                            "Action": [
                                                "sns:ConfirmSubscription",
                                                "sns:ListTopics",
                                                "sns:Publish",
                                                "sns:Subscribe",
                                                "sns:Unsubscribe"
                                            ],
                                            "Resource": [
                                                {
                                                    "Fn::Sub": "arn:aws:sns:eu-west-1:${AWS::AccountId}:tl-governator-stop"
                                                },
                                                {
                                                    "Fn::Sub": "arn:aws:sns:eu-west-1:${AWS::AccountId}:asgLambdaScale"
                                                },
                                                {
                                                    "Fn::Sub": "arn:aws:sns:eu-west-1:${AWS::AccountId}:InfraGovernator"
                                                },
                                                {
                                                    "Fn::Sub": "arn:aws:sns:eu-west-1:${AWS::AccountId}:InfraAsgLambdaScale"
                                                }
                                            ]
                                        },
                                        {
                                            "Effect": "Allow",
                                            "Action": [
                                                "dynamodb:*"
                                            ],
                                            "Resource": [
                                                {
                                                    "Fn::Sub": "arn:aws:dynamodb:eu-west-1:${AWS::AccountId}:table/ConfigAsgIPs"
                                                },
                                                {
                                                    "Fn::Sub": "arn:aws:dynamodb:eu-west-1:${AWS::AccountId}:table/InfraAsgIPs"
                                                }
                                            ]
                                        },
                                        {
                                            "Effect": "Allow",
                                            "Action": [
                                                "iam:PassRole"
                                            ],
                                            "Resource": [
                                                {
                                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/roleInfraAsgScale"
                                                }
                                            ]
                                        },
                                        {
                                            "Action": "sts:AssumeRole",
                                            "Effect": "Allow",
                                            "Resource": [
                                                {
                                                    "Fn::Sub": "arn:aws:iam::${pMasterAccountId}:role/roleInfraAsgScale"
                                                },
                                                {
                                                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/roleInfraAsgScale"
                                                }
                                            ]
                                        }
                                    ]
                                }
                            }
                        ],
                        "RoleName": "roleInfraAsgScale"
                    }
                }
            }),
        "Outputs": {}
    }
}
