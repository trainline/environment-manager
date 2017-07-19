resource "aws_dynamodb_table" "environments" {
  name           = "${var.stack}-${var.app}-ConfigEnvironments"
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

resource "aws_dynamodb_table" "services" {
  name             = "${var.stack}-${var.app}-ConfigServices"
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

resource "aws_dynamodb_table" "deployment_maps" {
  name             = "${var.stack}-${var.app}-ConfigDeploymentMaps"
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

resource "aws_dynamodb_table" "notification_settings" {
  name             = "${var.stack}-${var.app}-ConfigNotificationSettings"
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

resource "aws_dynamodb_table" "environment_types" {
  name             = "${var.stack}-${var.app}-ConfigEnvironmentTypes"
  read_capacity    = 10
  write_capacity   = 2
  hash_key         = "EnvironmentType"
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "EnvironmentType"
    type = "S"
  }
}

resource "aws_dynamodb_table" "audit" {
  name           = "${var.stack}-${var.app}-InfraChangeAudit"
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

resource "aws_dynamodb_table" "accounts" {
  name           = "${var.stack}-${var.app}-InfraConfigAccounts"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "AccountNumber"

  attribute {
    name = "AccountNumber"
    type = "N"
  }

  stream_view_type = "NEW_AND_OLD_IMAGES"
}

resource "aws_dynamodb_table" "clusters" {
  name           = "${var.stack}-${var.app}-InfraConfigClusters"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "ClusterName"

  attribute {
    name = "ClusterName"
    type = "S"
  }

  stream_view_type = "NEW_AND_OLD_IMAGES"
}

resource "aws_dynamodb_table" "permissions" {
  name           = "${var.stack}-${var.app}-InfraConfigPermissions"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "Name"

  attribute {
    name = "Name"
    type = "S"
  }

  stream_view_type = "NEW_AND_OLD_IMAGES"
}

resource "aws_dynamodb_table" "ops_environments" {
  name           = "${var.stack}-${var.app}-InfraOpsEnvironment"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "EnvironmentName"

  attribute {
    name = "EnvironmentName"
    type = "S"
  }

  stream_view_type = "NEW_AND_OLD_IMAGES"
}

resource "aws_dynamodb_table" "lb_settings" {
  name           = "${var.stack}-${var.app}-InfraConfigLbSettings"
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

resource "aws_dynamodb_table" "deployment_execution_status" {
  name           = "${var.stack}-${var.app}-ConfigDeploymentExecutionStatus"
  read_capacity  = 10
  write_capacity = 2
  hash_key       = "DeploymentID"

  attribute {
    name = "DeploymentID"
    type = "S"
  }
}

resource "aws_dynamodb_table" "completed_deployments" {
  name           = "${var.stack}-${var.app}-ConfigCompletedDeployments"
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

resource "aws_dynamodb_table" "lb_upstreams" {
  name           = "${var.stack}-${var.app}-InfraConfigLBUpstream"
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

  attribute {
    name = "Service"
    type = "S"
  }

  attribute {
    name = "Upstream"
    type = "S"
  }

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

# Outputs

output "ConfigLBUpstream_stream_arn" {
  value = "${aws_dynamodb_table.lb_upstreams.stream_arn}"
}

output "ConfigNotificationSettings_stream_arn" {
  value = "${aws_dynamodb_table.notification_settings.stream_arn}"
}

output "tableInfraConfigLbSettings_stream_arn" {
  value = "${aws_dynamodb_table.lb_settings.stream_arn}"
}
