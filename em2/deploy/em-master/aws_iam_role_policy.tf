resource "aws_iam_role_policy" "audit_writer" {
  name = "policy-${var.stack}-audit-writer"
  role = "${aws_iam_role.audit_writer.id}"

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
            "Resource": "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/${aws_dynamodb_table.audit.id}"
        }
    ]
}
EOF
}

resource "aws_iam_role_policy" "app" {
  name = "policy-${var.stack}-app"
  role = "${aws_iam_role.app.name}"

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
            "arn:aws:dynamodb:eu-west-1:${data.aws_caller_identity.current.account_id}:table/${var.stack}-Config*",
            "arn:aws:dynamodb:eu-west-1:${data.aws_caller_identity.current.account_id}:table/${var.stack}-Infra*",
            "arn:aws:dynamodb:eu-west-1:${data.aws_caller_identity.current.account_id}:table/${var.stack}-Environment*"
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
          "arn:aws:s3:::${var.secure_bucket}/${var.stack}",
          "arn:aws:s3:::${var.bucket}/${var.stack}/packages",
          "arn:aws:s3:::${var.bucket}/${var.stack}/logs"
        ]
      },
      {
         "Effect":"Allow",
         "Action": [
           "s3:GetObject" 
         ],
         "Resource":[
            "arn:aws:s3:::${var.secure_bucket}/${var.stack}/*",
            "arn:aws:s3:::${var.bucket}/${var.stack}/backups/*",
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
            "arn:aws:s3:::${var.bucket}/${var.stack}/logs/*",
            "arn:aws:s3:::${var.bucket}/${var.stack}/packages/*"
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

resource "aws_iam_policy" "scheduler_role_policy" {
  name = "policy-${var.stack}-scheduler"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "ec2:CreateNetworkInterface",
        "ec2:DescribeNetworkInterfaces",
        "ec2:DescribeInstances",
        "ec2:DeleteNetworkInterface",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "autoscaling:EnterStandby",
        "autoscaling:ExitStandby",
        "xray:PutTelemetryRecords",
        "xray:PutTraceSegments",
        "sts:AssumeRole",
        "kms:Decrypt"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "scheduler_role_policy_attach" {
  role       = "${aws_iam_role.scheduler_role.name}"
  policy_arn = "${aws_iam_policy.scheduler_role_policy.arn}"
}
