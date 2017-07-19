resource "aws_iam_role_policy" "roleInfraEnvironmentManagerAuditWriterPolicy" {
  name = "roleInfraEnvironmentManagerAuditWriterPolicy"
  role = "${aws_iam_role.roleInfraEnvironmentManagerAuditWriter.id}"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:BatchWriteItem",
                "dynamodb:PutItem"
            ],
            "Resource": "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${aws_dynamodb_table.InfraChangeAudit.id}"
        }
    ]
}
EOF
}

resource "aws_iam_role_policy" "roleInfraAsgScalePolicy" {
  name = "roleInfraAsgScalePolicy"
  role = "${aws_iam_role.roleInfraAsgScale.id}"

  policy = <<EOF
{  
   "Version":"2012-10-17",
   "Statement":[  
      {  
         "Effect":"Allow",
         "Action":[  
            "ec2:Describe*",
            "ec2:DeleteVolume",
            "ec2:RunInstances",
            "ec2:StartInstances",
            "ec2:StopInstances",
            "ec2:TerminateInstances",
            "ec2:UnmonitorInstances"
         ],
         "Resource":[  
            "*"
         ]
      },
      {  
         "Effect":"Allow",
         "Action":"elasticloadbalancing:Describe*",
         "Resource":"*"
      },
      {  
         "Effect":"Allow",
         "Action":[  
            "cloudwatch:ListMetrics",
            "cloudwatch:GetMetricStatistics",
            "cloudwatch:Describe*"
         ],
         "Resource":"*"
      },
      {  
         "Effect":"Allow",
         "Action":[  
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
         "Resource":[  
            "*"
         ]
      },
      {  
         "Effect":"Allow",
         "Action":[  
            "sns:ConfirmSubscription",
            "sns:ListTopics",
            "sns:Publish",
            "sns:Subscribe",
            "sns:Unsubscribe"
         ],
         "Resource":[  
            "arn:aws:sns:eu-west-1:${data.aws_caller_identity.current.account_id}:tl-governator-stop",
            "arn:aws:sns:eu-west-1:${data.aws_caller_identity.current.account_id}:asgLambdaScale",
            "arn:aws:sns:eu-west-1:${data.aws_caller_identity.current.account_id}:InfraGovernator",
            "arn:aws:sns:eu-west-1:${data.aws_caller_identity.current.account_id}:InfraAsgLambdaScale"
         ]
      },
      {  
         "Effect":"Allow",
         "Action":[  
            "dynamodb:*"
         ],
         "Resource":[  
            "arn:aws:dynamodb:eu-west-1:${data.aws_caller_identity.current.account_id}:table/ConfigAsgIPs",
            "arn:aws:dynamodb:eu-west-1:${data.aws_caller_identity.current.account_id}:table/InfraAsgIPs"
         ]
      },
      {  
         "Effect":"Allow",
         "Action":[  
            "iam:PassRole"
         ],
         "Resource":[  
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/roleInfraAsgScale"
         ]
      },
      {  
         "Action":"sts:AssumeRole",
         "Effect":"Allow",
         "Resource":[  
            "arn:aws:iam::${var.master_account_id}:role/roleInfraAsgScale",
            "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/roleInfraAsgScale"
         ]
      }
   ]
}
EOF
}

resource "aws_iam_role_policy" "roleInfraEnvironmentManagerPolicy" {
  name = "roleInfraEnvironmentManagerPolicy"
  role = "${aws_iam_role.roleInfraEnvironmentManager.name}"

  policy = <<EOF
{
   "Version":"2012-10-17",
   "Statement":[
      {
         "Effect":"Allow",
         "Action":[
            "dynamodb:Batch*",
            "dynamodb:DeleteItem",
            "dynamodb:Describe*",
            "dynamodb:Get*",
            "dynamodb:List*",
            "dynamodb:PutItem",
            "dynamodb:Query",
            "dynamodb:Scan",
            "dynamodb:UpdateItem"
         ],
         "Resource":[
            "arn:aws:dynamodb:eu-west-1:${data.aws_caller_identity.current.account_id}:table/Config*",
            "arn:aws:dynamodb:eu-west-1:${data.aws_caller_identity.current.account_id}:table/Infra*",
            "arn:aws:dynamodb:eu-west-1:${data.aws_caller_identity.current.account_id}:table/Environment*"
         ]
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetBucketLocation",
          "s3:ListAllMyBuckets"
        ],
        "Resource": [
          "arn:aws:s3:::*"
        ]
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:ListBucket"
        ],
        "Resource": [
          "arn:aws:s3:::${var.secrets_bucket}",
          "arn:aws:s3:::${var.packages_bucket}",
          "arn:aws:s3:::${var.deployment_logs_bucket}"
        ]
      },
      {
         "Effect":"Allow",
         "Action": [
           "s3:GetObject" 
         ],
         "Resource":[
            "arn:aws:s3:::${var.configuration_bucket}/*",
            "arn:aws:s3:::${var.secrets_bucket}/*",
            "arn:aws:s3:::${var.backups_bucket}/*",
            "arn:aws:s3:::${var.init_script_bucket}/*"
         ]
      },
      {
         "Effect":"Allow",
         "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:GetObjectVersion"
         ],
         "Resource": [
            "arn:aws:s3:::${var.deployment_logs_bucket}/*",
            "arn:aws:s3:::${var.packages_bucket}/*"
         ]
      },
      {
         "Action":"sts:AssumeRole",
         "Effect":"Allow",
         "Resource": [
           "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/roleInfraEnvironmentManagerChild"
         ]
      },
      {
         "Effect":"Allow",
         "Action":[
            "ec2:Describe*",
            "ec2:CreateTags"
         ],
         "Resource":[
            "*"
         ]
      },
      {
         "Effect":"Allow",
         "Action":[
            "autoscaling:CreateAutoScalingGroup",
            "autoscaling:DescribeAutoScalingGroups",
            "autoscaling:DescribeScheduledActions",
            "autoscaling:DescribeLaunchConfigurations",
            "autoscaling:DescribeAutoScalingGroups",
            "autoscaling:CreateLaunchConfiguration",
            "autoscaling:DeleteLaunchConfiguration",
            "autoscaling:UpdateAutoScalingGroup",
            "autoscaling:AttachInstances*",
            "autoscaling:PutNotificationConfiguration",
            "autoscaling:PutScheduledUpdateGroupAction",
            "autoscaling:PutLifecycleHook",
            "autoscaling:CreateOrUpdateTags",
            "autoscaling:EnterStandby",
            "autoscaling:ExitStandby"
         ],
         "Resource":[
            "*"
         ]
      },
      {
         "Effect":"Allow",
         "Action":[
            "sns:Get*",
            "sns:List*"
         ],
         "Resource":[
            "*"
         ]
      },
      {
         "Effect":"Allow",
         "Action":[
            "iam:PassRole",
            "iam:GetInstanceProfile",
            "iam:GetRole"
         ],
         "Resource":"*"
      },
      {
         "Effect":"Allow",
         "Action":[
            "sns:Subscribe",
            "sns:Unsubscribe",
            "sns:Publish"
         ],
         "Resource":[
            "arn:aws:sns:eu-west-1:${data.aws_caller_identity.current.account_id}:footplate*",
            "arn:aws:sns:eu-west-1:${data.aws_caller_identity.current.account_id}:environment*"
         ]
      },
             {
            "Effect" : "Allow",
            "Action" : [
                "sns:CreateTopic",
                "sns:Publish",
                "sns:Subscribe",
                "sns:Unsubscribe"
            ],
            "Resource" : [
                "arn:aws:sns:eu-west-1:${data.aws_caller_identity.current.account_id}:EnvironmentManagerConfigurationChange",
                "arn:aws:sns:eu-west-1:${data.aws_caller_identity.current.account_id}:EnvironmentManagerOperationsChange"
            ]
        }
   ]
}  
EOF
}
