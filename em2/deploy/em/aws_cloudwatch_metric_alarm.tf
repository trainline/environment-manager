resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigEnvironments" {
  alarm_name          = "AlertReadCapacityConfigEnvironments"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigServices" {
  alarm_name          = "AlertReadCapacityConfigServices"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigDeploymentMaps" {
  alarm_name          = "AlertReadCapacityConfigDeploymentMaps"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigLBSettings" {
  alarm_name          = "AlertReadCapacityConfigLBSettings"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigLBUpstream" {
  alarm_name          = "AlertReadCapacityConfigLBUpstream"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigNotificationSettings" {
  alarm_name          = "AlertReadCapacityConfigNotificationSettings"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigEnvironmentTypes" {
  alarm_name          = "AlertReadCapacityConfigEnvironmentTypes"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraAsgIPs" {
  alarm_name          = "AlertReadCapacityInfraAsgIPs"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraChangeAudit" {
  alarm_name          = "AlertReadCapacityInfraChangeAudit"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraConfigAccounts" {
  alarm_name          = "AlertReadCapacityInfraConfigAccounts"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraConfigClusters" {
  alarm_name          = "AlertReadCapacityInfraConfigClusters"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraConfigPermissions" {
  alarm_name          = "AlertReadCapacityInfraConfigPermissions"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraEnvManagerSessions" {
  alarm_name          = "AlertReadCapacityInfraEnvManagerSessions"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityInfraOpsEnvironment" {
  alarm_name          = "AlertReadCapacityInfraOpsEnvironment"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "alertInfraEnvironmentManagerAudit" {
  alarm_name          = "alertInfraEnvironmentManagerAudit"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "alertInfraAsgScale" {
  alarm_name          = "alertInfraAsgScale"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "alertInfraEnvironmentManagerLbSettingsRouter" {
  alarm_name          = "alertInfraEnvironmentManagerLbSettingsRouter"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigDeploymentExecutionStatus" {
  alarm_name          = "AlertReadCapacityConfigDeploymentExecutionStatus"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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

resource "aws_cloudwatch_metric_alarm" "AlertReadCapacityConfigCompletedDeployments" {
  alarm_name          = "AlertReadCapacityConfigCompletedDeployments"
  actions_enabled     = true
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
  alarm_actions       = ["${aws_sns_topic.alert_sns_topic.arn}"]
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
