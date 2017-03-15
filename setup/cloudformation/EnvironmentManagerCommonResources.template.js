'use strict';

module.exports = function ({ managedAccounts }) {

    managedAccounts = Array.from(new Set(managedAccounts || []));

    function streamArn(tableName) {
        return {
            'Fn::GetAtt': [
                tableName,
                'StreamArn'
            ]
        };
    }

    function triggerAll(functionName, sourceArn) {
        return {
            "Type": "AWS::Lambda::EventSourceMapping",
            "Properties": {
                "BatchSize": 25,
                "Enabled": true,
                "EventSourceArn": sourceArn,
                "FunctionName": {
                    "Ref": functionName
                },
                "StartingPosition": "LATEST"
            }
        }
    }

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
        "Resources": {
            "ConfigEnvironments": {
                "Type": "AWS::DynamoDB::Table",
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
            "ConfigServices": {
                "Type": "AWS::DynamoDB::Table",
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
            "ConfigDeploymentMaps": {
                "Type": "AWS::DynamoDB::Table",
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
            "ConfigEnvironmentTypes": {
                "Type": "AWS::DynamoDB::Table",
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
            "InfraConfigAccounts": {
                "Type": "AWS::DynamoDB::Table",
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
            "InfraConfigClusters": {
                "Type": "AWS::DynamoDB::Table",
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
            "InfraConfigPermissions": {
                "Type": "AWS::DynamoDB::Table",
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
            "InfraEnvManagerSessions": {
                "Type": "AWS::DynamoDB::Table",
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
            "InfraOpsEnvironment": {
                "Type": "AWS::DynamoDB::Table",
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
            "roleInfraDynamoStreamReplicaWriter": {
                "Type": "AWS::IAM::Role",
                "Condition": "ThisIsNotMasterAccount",
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
                                            "Fn::Sub": "arn:aws:iam::${pMasterAccountId}:root"
                                        }
                                    ]
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
                            "PolicyName": "roleInfraDynamoStreamReplicaWriterPolicy",
                            "PolicyDocument": {
                                "Version": "2012-10-17",
                                "Statement": [
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "dynamodb:DeleteItem",
                                            "dynamodb:PutItem"
                                        ],
                                        "Resource": [
                                            'ConfigEnvironments',
                                            'ConfigServices',
                                            'ConfigDeploymentMaps',
                                            'ConfigLBSettings',
                                            'ConfigLBUpstream',
                                            'ConfigDeploymentExecutionStatus',
                                            'ConfigEnvironmentTypes',
                                            'InfraAsgIPs',
                                            'InfraConfigAccounts',
                                            'InfraConfigClusters',
                                            'InfraConfigPermissions',
                                            'InfraEnvManagerSessions',
                                            'InfraOpsEnvironment'
                                        ].map(name => ({
                                            "Fn::Sub": `arn:aws:dynamodb:\${AWS::Region}:\${AWS::AccountId}:table/\${${name}}`
                                        }))
                                    }
                                ]
                            }
                        }
                    ],
                    "RoleName": "roleInfraDynamoStreamReplicaWriter"
                }
            },
            "lambdaInfraDynamoStreamReplica": {
                "Type": "AWS::Lambda::Function",
                "Condition": "ThisIsMasterAccount",
                "DependsOn": [
                    "ConfigEnvironments",
                    "ConfigServices",
                    "ConfigDeploymentMaps",
                    "ConfigLBSettings",
                    "ConfigLBUpstream",
                    "ConfigDeploymentExecutionStatus",
                    "ConfigEnvironmentTypes",
                    "InfraAsgIPs",
                    "InfraChangeAudit",
                    "InfraConfigAccounts",
                    "InfraConfigClusters",
                    "InfraConfigPermissions",
                    "InfraEnvManagerSessions",
                    "InfraOpsEnvironment"
                ],
                "Properties": {
                    "Code": "./lambda/InfraDynamoStreamReplica/infra-dynamo-stream-replica.zip",
                    "Description": "This function replicates data from DynamoDB tables in this account to the corresponding tables in the child accounts it manages.",
                    "FunctionName": "InfraDynamoStreamReplica",
                    "Handler": "index.handler",
                    "MemorySize": 128,
                    "Role": {
                        "Fn::GetAtt": [
                            "roleInfraDynamoStreamReplica",
                            "Arn"
                        ]
                    },
                    "Runtime": "nodejs4.3",
                    "Timeout": 30
                }
            },
            "roleInfraDynamoStreamReplica": {
                "Type": "AWS::IAM::Role",
                "Condition": "ThisIsMasterAccount",
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
                            "PolicyName": "roleInfraDynamoStreamReplicaPolicy",
                            "PolicyDocument": {
                                "Version": "2012-10-17",
                                "Statement": [
                                    {
                                        "Action": "sts:AssumeRole",
                                        "Effect": "Allow",
                                        "Resource": managedAccounts.map(accountNumber => `arn:aws:iam::${accountNumber}:role/roleInfraDynamoStreamReplicaWriter`)
                                    },
                                    {
                                        "Effect": "Allow",
                                        "Action": [
                                            "dynamodb:GetRecords",
                                            "dynamodb:GetShardIterator",
                                            "dynamodb:DescribeStream",
                                            "dynamodb:ListStreams"
                                        ],
                                        "Resource": [
                                            'ConfigServices',
                                            'InfraConfigClusters',
                                            'ConfigEnvironments',
                                            'ConfigEnvironmentTypes',
                                            'ConfigDeploymentMaps',
                                            'InfraConfigAccounts',
                                            'InfraOpsEnvironment'
                                        ].map(streamArn)
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
            "replicaTriggerInfraConfigClusters": trigger('lambdaInfraDynamoStreamReplica', streamArn('InfraConfigClusters')),
            "replicaTriggerInfraOpsEnvironment": trigger('lambdaInfraDynamoStreamReplica', streamArn('InfraOpsEnvironment')),
            "replicaTriggerConfigEnvironments": trigger('lambdaInfraDynamoStreamReplica', streamArn('ConfigEnvironments')),
            "replicaTriggerConfigDeploymentMaps": trigger('lambdaInfraDynamoStreamReplica', streamArn('ConfigDeploymentMaps')),
            "replicaTriggerConfigServices": trigger('lambdaInfraDynamoStreamReplica', streamArn('ConfigServices')),
            "replicaTriggerConfigEnvironmentTypes": trigger('lambdaInfraDynamoStreamReplica', streamArn('ConfigEnvironmentTypes')),
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
                            "PolicyName": "roleInfraDynamoStreamReplicaPolicy",
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
        },
        "Outputs": {}
    }
}
