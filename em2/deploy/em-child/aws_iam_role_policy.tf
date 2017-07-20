resource "aws_iam_role_policy" "app" {
  name = "policy-${var.stack}-${var.app}-child"
  role = "${aws_iam_role.app.name}"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
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
            "Resource": [
                "arn:aws:dynamodb:eu-west-1:${data.aws_caller_identity.current.account_id}:table/Config*",
                "arn:aws:dynamodb:eu-west-1:${data.aws_caller_identity.current.account_id}:table/Infra*",
                "arn:aws:dynamodb:eu-west-1:${data.aws_caller_identity.current.account_id}:table/Environment*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": [
                "arn:aws:s3:::${var.bucket_logs}",
                "arn:aws:s3:::${var.bucket_deployments}"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "ec2:Describe*",
                "ec2:CreateTags"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
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
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "sns:Get*",
                "sns:List*"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:PassRole",
                "iam:GetInstanceProfile",
                "iam:GetRole"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "sns:Subscribe",
                "sns:Unsubscribe",
                "sns:Publish"
            ],
            "Resource": [
                "arn:aws:sns:eu-west-1:${data.aws_caller_identity.current.account_id}:footplate*",
                "arn:aws:sns:eu-west-1:${data.aws_caller_identity.current.account_id}:environment*"
            ]
        }
    ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "scheduler_role_policy_attach" {
  role       = "${aws_iam_role.scheduler_role.name}"
  policy_arn = "${aws_iam_policy.scheduler_role_policy.arn}"
}

resource "aws_iam_policy" "scheduler_role_policy" {
  name = "policy-em-scheduler"
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
