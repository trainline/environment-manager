# AWS
provider "aws" {}

data "aws_region" "current" {
  current = true
}

# Use this data source to get the access to the effective 
# Account ID, User ID, and ARN in which Terraform is authorized.
data "aws_caller_identity" "current" {}
