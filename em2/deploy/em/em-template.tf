# AWS
provider "aws" {}

data "aws_region" "current" {
  current = true
}

data "aws_caller_identity" "current" {}

# Common Resources

resource "aws_dynamodb_table" "ConfigEnvironments" {
  name           = "ConfigEnvironments"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "EnvironmentName"
  stream_enabled = true

  attribute {
    name = "EnvironmentName"
    type = "S"
  }

  stream_view_type = "NEW_AND_OLD_IMAGES"
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigEnvironments" {
  alarm_name          = "AlertReadCapacityConfigEnvironments"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityConfigEnvironments"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigEnvironments"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityConfigEnvironments" {
  alarm_name          = "AlertWriteCapacityConfigEnvironments"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityConfigEnvironments"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigEnvironments"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "ConfigServices" {
  name             = "ConfigServices"
  read_capacity    = 10
  write_capacity   = 2
  hash_key         = "ServiceName"
  range_key        = "OwningCluster"
  stream_view_type = "NEW_AND_OLD_IMAGES"
  stream_enabled   = true

  attribute {
    name = "ServiceName"
    type = "S"
  }

  attribute {
    name = "OwningCluster"
    type = "S"
  }
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigServices" {
  alarm_name          = "AlertReadCapacityConfigServices"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityConfigServices"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigServices"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityConfigServices" {
  alarm_name          = "AlertWriteCapacityConfigServices"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityConfigServices"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigServices"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "ConfigDeploymentMaps" {
  name             = "ConfigDeploymentMaps"
  read_capacity    = 10
  write_capacity   = 2
  hash_key         = "DeploymentMapName"
  stream_view_type = "NEW_AND_OLD_IMAGES"
  stream_enabled   = true

  attribute {
    name = "DeploymentMapName"
    type = "S"
  }
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigDeploymentMaps" {
  alarm_name          = "AlertReadCapacityConfigDeploymentMaps"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityConfigDeploymentMaps"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigDeploymentMaps"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityConfigDeploymentMaps" {
  alarm_name          = "AlertWriteCapacityConfigDeploymentMaps"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityConfigDeploymentMaps"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigServices"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "ConfigLBSettings" {
  name             = "ConfigLBSettings"
  read_capacity    = 10
  write_capacity   = 2
  hash_key         = "EnvironmentHostName"
  range_key        = "VHostName"
  stream_view_type = "NEW_AND_OLD_IMAGES"
  stream_enabled   = true

  attribute {
    name = "EnvironmentHostName"
    type = "S"
  }

  attribute {
    name = "VHostName"
    type = "S"
  }
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigLBSettings" {
  alarm_name          = "AlertReadCapacityConfigLBSettings"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityConfigLBSettings"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigLBSettings"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityConfigLBSettings" {
  alarm_name          = "AlertWriteCapacityConfigLBSettings"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityConfigLBSettings"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigServices"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "ConfigLBUpstream" {
  name             = "ConfigLBUpstream"
  read_capacity    = 10
  write_capacity   = 2
  hash_key         = "key"
  stream_view_type = "NEW_AND_OLD_IMAGES"
  stream_enabled   = true

  attribute {
    name = "key"
    type = "S"
  }
}

output "ConfigLBUpstream_stream_arn" {
  value = "${aws_dynamodb_table.ConfigLBUpstream.stream_arn}"
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigLBUpstream" {
  alarm_name          = "AlertReadCapacityConfigLBUpstream"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityConfigLBUpstream"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigLBUpstream"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityConfigLBUpstream" {
  alarm_name          = "AlertWriteCapacityConfigLBUpstream"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityConfigLBUpstream"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigLBUpstream"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "ConfigNotificationSettings" {
  name             = "ConfigNotificationSettings"
  read_capacity    = 10
  write_capacity   = 2
  hash_key         = "NotificationSettingsId"
  stream_view_type = "NEW_AND_OLD_IMAGES"
  stream_enabled   = true

  attribute {
    name = "NotificationSettingsId"
    type = "S"
  }
}

output "ConfigNotificationSettings_stream_arn" {
  value = "${aws_dynamodb_table.ConfigNotificationSettings.stream_arn}"
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigNotificationSettings" {
  alarm_name          = "AlertReadCapacityConfigNotificationSettings"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityConfigNotificationSettings"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigNotificationSettings"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityConfigNotificationSettings" {
  alarm_name          = "AlertWriteCapacityConfigNotificationSettings"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityConfigNotificationSettings"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigNotificationSettings"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "ConfigEnvironmentTypes" {
  name             = "ConfigEnvironmentTypes"
  read_capacity    = 10
  write_capacity   = 2
  hash_key         = "EnvironmentType"
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "EnvironmentType"
    type = "S"
  }
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigEnvironmentTypes" {
  alarm_name          = "AlertReadCapacityConfigEnvironmentTypes"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityConfigEnvironmentTypes"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigEnvironmentTypes"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityConfigEnvironmentTypes" {
  alarm_name          = "AlertWriteCapacityConfigEnvironmentTypes"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityConfigEnvironmentTypes"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigEnvironmentTypes"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "InfraAsgIPs" {
  name           = "InfraAsgIPs"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "AsgName"

  attribute {
    name = "AsgName"
    type = "S"
  }
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraAsgIPs" {
  alarm_name          = "AlertReadCapacityInfraAsgIPs"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityInfraAsgIPs"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraAsgIPs"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityInfraAsgIPs" {
  alarm_name          = "AlertWriteCapacityInfraAsgIPs"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityInfraAsgIPs"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraAsgIPs"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "InfraChangeAudit" {
  name           = "InfraChangeAudit"
  read_capacity  = 20
  write_capacity = 5
  hash_key       = "AuditID"

  attribute {
    name = "AuditID"
    type = "S"
  }

  attribute {
    name = "Date"
    type = "S"
  }

  attribute {
    name = "ISOTimestamp"
    type = "S"
  }

  global_secondary_index {
    name            = "Date-ISOTimestamp-index"
    hash_key        = "Date"
    range_key       = "ISOTimestamp"
    write_capacity  = 5
    read_capacity   = 10
    projection_type = "ALL"
  }
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraChangeAudit" {
  alarm_name          = "AlertReadCapacityInfraChangeAudit"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityInfraChangeAudit"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraChangeAudit"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityInfraChangeAudit" {
  alarm_name          = "AlertWriteCapacityInfraChangeAudit"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityInfraChangeAudit"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraChangeAudit"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "InfraConfigAccounts" {
  name           = "InfraConfigAccounts"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "AccountNumber"

  attribute {
    name = "AccountNumber"
    type = "S"
  }

  stream_view_type = "NEW_AND_OLD_IMAGES"
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraConfigAccounts" {
  alarm_name          = "AlertReadCapacityInfraConfigAccounts"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityInfraConfigAccounts"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraConfigAccounts"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityInfraConfigAccounts" {
  alarm_name          = "AlertWriteCapacityInfraConfigAccounts"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityInfraConfigAccounts"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraConfigAccounts"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "InfraConfigClusters" {
  name           = "InfraConfigClusters"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "ClusterName"

  attribute {
    name = "ClusterName"
    type = "S"
  }

  stream_view_type = "NEW_AND_OLD_IMAGES"
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraConfigClusters" {
  alarm_name          = "AlertReadCapacityInfraConfigClusters"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityInfraConfigClusters"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraConfigClusters"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityInfraConfigClusters" {
  alarm_name          = "AlertWriteCapacityInfraConfigClusters"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityInfraConfigClusters"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraConfigClusters"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "InfraConfigPermissions" {
  name           = "InfraConfigPermissions"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "Name"

  attribute {
    name = "Name"
    type = "S"
  }

  stream_view_type = "NEW_AND_OLD_IMAGES"
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraConfigPermissions" {
  alarm_name          = "AlertReadCapacityInfraConfigPermissions"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityInfraConfigPermissions"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraConfigPermissions"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityInfraConfigPermissions" {
  alarm_name          = "AlertWriteCapacityInfraConfigPermissions"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityInfraConfigPermissions"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraConfigPermissions"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "InfraEnvManagerSessions" {
  name           = "InfraEnvManagerSessions"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "UserName"

  attribute {
    name = "UserName"
    type = "S"
  }
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraEnvManagerSessions" {
  alarm_name          = "AlertReadCapacityInfraEnvManagerSessions"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityInfraEnvManagerSessions"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraEnvManagerSessions"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityInfraEnvManagerSessions" {
  alarm_name          = "AlertWriteCapacityInfraEnvManagerSessions"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityInfraEnvManagerSessions"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraEnvManagerSessions"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "InfraOpsEnvironment" {
  name           = "InfraOpsEnvironment"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "EnvironmentName"

  attribute {
    name = "EnvironmentName"
    type = "S"
  }

  stream_view_type = "NEW_AND_OLD_IMAGES"
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraOpsEnvironment" {
  alarm_name          = "AlertReadCapacityInfraOpsEnvironment"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityInfraOpsEnvironment"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraOpsEnvironment"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityInfraOpsEnvironment" {
  alarm_name          = "AlertWriteCapacityInfraOpsEnvironment"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityInfraOpsEnvironment"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "InfraOpsEnvironment"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_lambda_function" "lambdaInfraEnvironmentManagerAudit" {
  filename         = "./lambda/InfraEnvironmentManagerAudit/infra-environment-manager-audit.zip"
  function_name    = "InfraEnvironmentManagerAudit"
  role             = "${aws_iam_role.roleInfraEnvironmentManagerAudit.arn}"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("./lambda/InfraEnvironmentManagerAudit/infra-environment-manager-audit.zip"))}"
  runtime          = "nodejs4.3"
  memory_size      = 128
  timeout          = 3
  description      = "This function responds to a DynamoDB stream event by writing the value of each record before and after the change to an audit log."
}

output "lambdaInfraEnvironmentManagerAudit_id" {
  value = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
}

resource "aws_cloudwatch_metric_alarm" "alertInfraEnvironmentManagerAudit" {
  alarm_name          = "alertInfraEnvironmentManagerAudit"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "alertInfraEnvironmentManagerAudit"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    FunctionName = "InfraEnvironmentManagerAudit"
  }

  evaluation_periods = "1"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "60"
  statistic          = "Sum"
  threshold          = "0"
}

resource "aws_iam_role" "roleInfraEnvironmentManagerAudit" {
  name = "roleInfraEnvironmentManagerAudit"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

output "roleInfraEnvironmentManagerAudit_id" {
  value = "${aws_iam_role.roleInfraEnvironmentManagerAudit.name}"
}

# resource "aws_lambda_event_source_mapping" "auditTriggerConfigLBUpstream" {
#   batch_size        = 25
#   event_source_arn  = "${var.ConfigLBUpstream.stream_arn}"
#   enabled           = true
#   function_name     = "${var.lambdaInfraEnvironmentManagerAudit_id}"
#   starting_position = "LATEST"
# }

# resource "aws_lambda_event_source_mapping" "auditTriggerConfigServices" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.ConfigServices.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }

# resource "aws_lambda_event_source_mapping" "auditTriggerInfraConfigClusters" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.InfraConfigClusters.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }

# resource "aws_lambda_event_source_mapping" "auditTriggerConfigEnvironments" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.ConfigEnvironments.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }

# resource "aws_lambda_event_source_mapping" "auditTriggerInfraConfigPermissions" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.InfraConfigPermissions.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }

# resource "aws_lambda_event_source_mapping" "auditTriggerConfigEnvironmentTypes" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.ConfigEnvironmentTypes.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }

# resource "aws_lambda_event_source_mapping" "auditTriggerConfigDeploymentMaps" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.ConfigDeploymentMaps.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }

# resource "aws_lambda_event_source_mapping" "auditTriggerInfraConfigAccounts" {
#   batch_size        = 25
#   event_source_arn  = "${aws_dynamodb_table.InfraConfigAccounts.stream_arn}"
#   enabled           = true
#   function_name     = "${aws_lambda_function.lambdaInfraEnvironmentManagerAudit.id}"
#   starting_position = "LATEST"
# }

# resource "aws_iam_role_policy" "roleInfraEnvironmentManagerAuditPolicy" {
#   name = "roleInfraEnvironmentManagerAuditPolicy"
#   role = "${aws_iam_role.roleInfraEnvironmentManagerAudit.id}"

#   policy = <<EOF
# {
# "Version": "2012-10-17",
# "Statement": [
#   {
#       "Effect": "Allow",
#       "Action": [
#           "dynamodb:GetRecords",
#           "dynamodb:GetShardIterator",
#           "dynamodb:DescribeStream",
#           "dynamodb:ListStreams"
#       ],
#       "Resource": [
#           "${aws_dynamodb_table.ConfigLBSettings.stream_arn}",
#           "${aws_dynamodb_table.ConfigLBUpstream.stream_arn}",
#           "${aws_dynamodb_table.ConfigServices.stream_arn}",
#           "${aws_dynamodb_table.InfraConfigClusters.stream_arn}",
#           "${aws_dynamodb_table.ConfigEnvironments.stream_arn}",
#           "${aws_dynamodb_table.InfraConfigPermissions.stream_arn}",
#           "${aws_dynamodb_table.ConfigEnvironmentTypes.stream_arn}",
#           "${aws_dynamodb_table.ConfigDeploymentMaps.stream_arn}",
#           "${aws_dynamodb_table.InfraConfigAccounts.stream_arn}",
#           "${aws_dynamodb_table.ConfigNotificationSettings.stream_arn}"
#       ]
#   }
# }  
# EOF
# }

resource "aws_iam_role" "roleInfraEnvironmentManagerAuditWriter" {
  name = "roleInfraEnvironmentManagerAuditWriter"

  assume_role_policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF
}

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

resource "aws_iam_role" "roleInfraAsgScale" {
  name = "roleInfraAsgScale"

  assume_role_policy = <<EOF
{
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

resource "aws_lambda_function" "lambdaInfraAsgScale" {
  filename         = "./lambda/InfraAsgLambdaScale/InfraAsgLambdaScale.zip"
  function_name    = "InfraAsgScale"
  role             = "${aws_iam_role.roleInfraEnvironmentManagerAudit.arn}"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("./lambda/InfraAsgLambdaScale/InfraAsgLambdaScale.zip"))}"
  runtime          = "nodejs4.3"
  memory_size      = 128
  timeout          = 30
  description      = "This function scales auto scaling groups."
}

resource "aws_cloudwatch_metric_alarm" "alertInfraAsgScale" {
  alarm_name          = "alertInfraAsgScale"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "alertInfraAsgScale"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    FunctionName = "InfraAsgScale"
  }

  evaluation_periods = "1"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "60"
  statistic          = "Sum"
  threshold          = "0"
}

#Parameters Missing
#AlertSNSTopic
#roleInfraEnvironmentManagerAudit -> ManagedPolicy arn

resource "aws_sns_topic" "AlertSNSTopic" {
  name = "AlertSNSTopic"
}

#"ManagedPolicyArns": [
#    "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
#],

#Assume Role within roleInfraEnvironmentManagerAuditPolicy

# List of managed accounts for the role roleInfraEnvironmentManagerAuditWriter

#Managed policy arn for roleInfraEnvironmentManagerAuditWriter

#Managed policy for roleInfraAsgScale

###################################
# Environment Manager LB Settings #
###################################

resource "aws_dynamodb_table" "tableInfraConfigLbSettings" {
  name           = "tableInfraConfigLbSettings"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "EnvironmentName"
  range_key      = "VHostName"
  stream_enabled = true

  attribute {
    name = "EnvironmentName"
    type = "S"
  }

  attribute {
    name = "LoadBalancerGroup"
    type = "S"
  }

  attribute {
    name = "VHostName"
    type = "S"
  }

  global_secondary_index {
    name            = "LoadBalancerGroup-index"
    hash_key        = "LoadBalancerGroup"
    write_capacity  = 2
    read_capacity   = 10
    projection_type = "ALL"
  }

  stream_view_type = "NEW_AND_OLD_IMAGES"
}

output "tableInfraConfigLbSettings_stream_arn" {
  value = "${aws_dynamodb_table.tableInfraConfigLbSettings.stream_arn}"
}

resource "aws_lambda_function" "lambdaInfraEnvironmentManagerLbSettingsRouter" {
  filename         = "./lambda/InfraEnvironmentManagerLbSettingsRouter/InfraEnvironmentManagerLbSettingsRouter.zip"
  function_name    = "lambdaInfraEnvironmentManagerLbSettingsRouter"
  role             = "${aws_iam_role.roleInfraEnvironmentManagerAudit.arn}"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("./lambda/InfraEnvironmentManagerLbSettingsRouter/InfraEnvironmentManagerLbSettingsRouter.zip"))}"
  runtime          = "nodejs4.3"
  memory_size      = 128
  timeout          = 30
  description      = "This function scales auto scaling groups."
}

output "lambdaInfraEnvironmentManagerLbSettingsRouter_id" {
  value = "${aws_lambda_function.lambdaInfraEnvironmentManagerLbSettingsRouter.id}"
}

resource "aws_cloudwatch_metric_alarm" "alertInfraEnvironmentManagerLbSettingsRouter" {
  alarm_name          = "alertInfraEnvironmentManagerLbSettingsRouter"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "Error propagating load balancer settings change to the destination account"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    FunctionName = "${aws_lambda_function.lambdaInfraEnvironmentManagerLbSettingsRouter.id}"
  }

  evaluation_periods = "1"
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = "60"
  statistic          = "Sum"
  threshold          = "0"
}

########################################
# Environment Manager Master Resources #
########################################

resource "aws_dynamodb_table" "ConfigDeploymentExecutionStatus" {
  name           = "ConfigDeploymentExecutionStatus"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "DeploymentID"

  attribute {
    name = "DeploymentID"
    type = "S"
  }
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigDeploymentExecutionStatus" {
  alarm_name          = "AlertReadCapacityConfigDeploymentExecutionStatus"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityConfigDeploymentExecutionStatus"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigDeploymentExecutionStatus"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityConfigDeploymentExecutionStatus" {
  alarm_name          = "AlertWriteCapacityConfigDeploymentExecutionStatus"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityConfigDeploymentExecutionStatus"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigDeploymentExecutionStatus"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_dynamodb_table" "ConfigCompletedDeployments" {
  name           = "ConfigCompletedDeployments"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "DeploymentID"

  attribute {
    name = "DeploymentID"
    type = "S"
  }

  attribute {
    name = "StartTimestamp"
    type = "S"
  }

  attribute {
    name = "StartDate"
    type = "S"
  }

  global_secondary_index {
    name            = "StartDate-StartTimestamp-index"
    hash_key        = "StartDate"
    range_key       = "StartTimestamp"
    write_capacity  = 2
    read_capacity   = 10
    projection_type = "ALL"
  }

  stream_view_type = "NEW_AND_OLD_IMAGES"
}

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigCompletedDeployments" {
  alarm_name          = "AlertReadCapacityConfigCompletedDeployments"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertReadCapacityConfigCompletedDeployments"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigCompletedDeployments"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedReadCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "8"
}

resource "aws_cloudwatch_metric_alarm" "AlertWriteCapacityConfigCompletedDeployments" {
  alarm_name          = "AlertWriteCapacityConfigCompletedDeployments"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
  alarm_description   = "AlertWriteCapacityConfigCompletedDeployments"
  comparison_operator = "GreaterThanThreshold"

  dimensions = {
    TableName = "ConfigCompletedDeployments"
  }

  evaluation_periods = "1"
  metric_name        = "ConsumedWriteCapacityUnits"
  namespace          = "AWS/DynamoDB"
  period             = "60"
  statistic          = "Sum"
  threshold          = "1.6"
}

resource "aws_elb" "loadBalancerEnvironmentManager" {
  name            = "environmentmanager-elb"
  security_groups = ["${aws_security_group.sgInfraEnvironmentManagerElb.id}"]
  subnets         = "${var.load_balancer_em_subnet_ids}"
  internal        = true

  # access_logs {
  #   bucket        = "foo"
  #   bucket_prefix = "bar"
  #   interval      = 60
  # }

  listener {
    instance_port     = "${var.load_balancer_em_port}"
    instance_protocol = "http"
    lb_port           = "${var.load_balancer_em_listener_port}"
    lb_protocol       = "http"
  }
  health_check {
    healthy_threshold   = 2
    unhealthy_threshold = 5
    timeout             = 3
    target              = "HTTP:${var.load_balancer_em_port}/${var.load_balancer_em_health_check}"
    interval            = 5
  }
  cross_zone_load_balancing   = true
  idle_timeout                = "${var.load_balancer_em_timeout}"
  connection_draining         = true
  connection_draining_timeout = "${var.load_balancer_em_timeout}"
  tags {
    Name = "foobar-terraform-elb"
  }
}

resource "aws_security_group" "sgInfraEnvironmentManager" {
  description = "Security Group for Environment Manager"
  vpc_id      = "${var.vpc_id}"

  tags = {
    Name = "sgInfraEnvironmentManager"
  }
}

resource "aws_security_group" "sgInfraEnvironmentManagerElb" {
  name        = "sgInfraEnvironmentManager"
  description = "Security Group for Environment Manager"
  vpc_id      = "${var.vpc_id}"

  tags = {
    Name = "sgInfraEnvironmentManagerElb"
  }
}

resource "aws_security_group_rule" "sgiInfraEnvironmentManagerElbTcp443fromInternalSubnet" {
  type        = "ingress"
  from_port   = "${var.load_balancer_em_port}"
  to_port     = "${var.load_balancer_em_port}"
  protocol    = "tcp"
  cidr_blocks = ["${var.cidr_ip}"]

  security_group_id = "${aws_security_group.sgInfraEnvironmentManagerElb.id}"
}

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "image-id"
    values = ["ami-a8d2d7ce"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_launch_configuration" "launchConfigEnvironmentManager" {
  iam_instance_profile = "${aws_iam_instance_profile.instanceProfileEnvironmentManager.id}"
  image_id             = "${data.aws_ami.ubuntu.id}"
  enable_monitoring    = true
  instance_type        = "t2.micro"
  security_groups      = ["${list(aws_security_group.sgInfraEnvironmentManager.id)}"]
  user_data            = "#!/usr/bin/env bash \n echo HELLO WORLD > /var/log/userdata.stdout.txt"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_instance_profile" "instanceProfileEnvironmentManager" {
  name = "instanceProfileEnvironmentManager"
  role = "${aws_iam_role.roleInfraEnvironmentManager.name}"
  path = "/EnvironmentManager/"
}

resource "aws_iam_role" "roleInfraEnvironmentManager" {
  name = "roleInfraEnvironmentManager"

  assume_role_policy = <<EOF
{
   "Version":"2012-10-17",
   "Statement":[
      {
         "Effect":"Allow",
         "Principal":{
            "Service":"ec2.amazonaws.com"
         },
         "Action":"sts:AssumeRole"
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
         "Effect":"Allow",
         "Action":"s3:GetObject",
         "Resource":[
            "arn:aws:s3:::${var.configuration_bucket}/*",
            "arn:aws:s3:::${var.secrets_bucket}/*",
            "arn:aws:s3:::${var.backups_bucket}/*"
         ]
      },
      {
         "Effect":"Allow",
         "Action": [
            "s3:GetObject",
            "s3:PutObject"
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
      }
   ]
}  
EOF
}

resource "aws_autoscaling_group" "asgEnvironmentManager" {
  default_cooldown          = 30
  desired_capacity          = 2
  health_check_grace_period = 30
  health_check_type         = "EC2"
  launch_configuration      = "${aws_launch_configuration.launchConfigEnvironmentManager.name}"
  load_balancers            = ["${aws_elb.loadBalancerEnvironmentManager.id}"]
  max_size                  = 4
  min_size                  = 0

  tags = [
    {
      key                 = "Role"
      value               = "EnvironmentManager"
      propagate_at_launch = true
    },
  ]

  vpc_zone_identifier = "${var.load_balancer_em_subnet_ids}"
}

# Missing 
# SourceSecurityGroupId in sgiInfraEnvironmentManagerTcp40500fromSgInfraEnvironmentManagerElb
# Managed policy arn for roleInfraEnvironmentManager

#############################
# Environment Manager Redis #
#############################

# resource "aws_elasticache_subnet_group" "bar" {
#   name       = "redis-subnet"
#   subnet_ids = ["${var.redis_subnet_group_id}"]
# }

resource "aws_elasticache_cluster" "redisEnvironmentManager" {
  cluster_id = "environment-manager"
  node_type  = "cache.t2.micro"

  #subnet_group_name = "redis-subnet"
  engine          = "redis"
  num_cache_nodes = 1
  port            = "${var.redis_port}"

  tags = {
    Role = "EnvironmentManager"
  }

  # security_group_ids = "${var.redis_security_group_ids}"
}

#################
# Redis Network #
#################

resource "aws_security_group" "sgEnvironmentManagerRedisAccess" {
  vpc_id = "${var.vpc_base}"

  tags = {
    Name = "sgEnvironmentManagerRedisAccess"
  }
}

resource "aws_security_group" "sgEnvironmentManagerRedisHost" {
  vpc_id = "${var.vpc_base}"

  tags = {
    Name = "sgEnvironmentManagerRedisHost"
  }

  ingress {
    protocol  = "tcp"
    self      = true
    from_port = "${var.redis_port}"
    to_port   = "${var.redis_port}"
  }
}

#############
# Upstreams #
#############

resource "aws_dynamodb_table" "InfraConfigLBUpstream" {
  name           = "InfraConfigLBUpstream"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "Key"

  attribute {
    name = "AccountId"
    type = "S"
  }

  attribute {
    name = "Environment"
    type = "S"
  }

  attribute {
    name = "Key"
    type = "S"
  }

  attribute {
    name = "LoadBalancerGroup"
    type = "S"
  }

  # attribute {
  #   name = "Service"
  #   type = "S"
  # }


  # attribute {
  #   name = "Upstream"
  #   type = "S"
  # }

  global_secondary_index {
    name            = "AccountId-index"
    hash_key        = "AccountId"
    range_key       = "Key"
    write_capacity  = 10
    read_capacity   = 2
    projection_type = "ALL"
  }
  global_secondary_index {
    name            = "Environment-Key-index"
    hash_key        = "Environment"
    range_key       = "Key"
    write_capacity  = 10
    read_capacity   = 2
    projection_type = "ALL"
  }
  global_secondary_index {
    name               = "LoadBalancerGroup-index"
    hash_key           = "LoadBalancerGroup"
    range_key          = "Key"
    write_capacity     = 10
    read_capacity      = 2
    projection_type    = "ALL"
    non_key_attributes = ["Service", "Upstream"]
  }
  stream_view_type = "NEW_AND_OLD_IMAGES"
}

# resource "aws_lambda_function" "lambdaInfraEnvironmentManagerUpstreamRouter" {
#   filename         = "./lambda/InfraEnvironmentManagerUpstreamRouter/InfraEnvironmentManagerUpstreamRouter.zip"
#   function_name    = "${var.resource_prefix}InfraEnvironmentManagerUpstreamRouter"
#   role             = "${var.upstream_router_execution_role}"
#   handler          = "exports.test"
#   source_code_hash = "${base64sha256(file("./lambda/InfraEnvironmentManagerUpstreamRouter/InfraEnvironmentManagerUpstreamRouter.zip"))}"
#   runtime          = "nodejs6.10"
#   memory_size      = 128
#   timeout          = 10


#   environment {
#     variables = {
#       DESTINATION_TABLE = "${var.destination_table}"
#       ROLE_NAME         = "${var.role_name}"
#     }
#   }
# }


# resource "aws_cloudwatch_metric_alarm" "alertInfraEnvironmentManagerUpstreamRouter" {
#   alarm_name          = "${var.resource_prefix}alertInfraEnvironmentManagerUpstreamRouter"
#   actions_enabled     = true
#   alarm_actions       = ["${aws_sns_topic.AlertSNSTopic.arn}"]
#   alarm_description   = "AlertReadCapacityConfigEnvironments"
#   comparison_operator = "GreaterThanThreshold"


#   dimensions = {
#     FunctionName = "lambdaInfraEnvironmentManagerUpstreamRouter"
#   }


#   evaluation_periods = "1"
#   metric_name        = "Errors"
#   namespace          = "AWS/Lambda"
#   period             = "60"
#   statistic          = "Sum"
#   threshold          = "8"
# }

