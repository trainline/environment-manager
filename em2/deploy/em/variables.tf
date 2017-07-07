variable "master_account_id" {
  description = "Master Account ID"
  default     = "12345"
}

variable "resource_prefix" {
  description = "Used as a prefix to EM resources."
  default     = "em-prefix-"
}

variable "subnet_ids" {
  default = {
    private_a = "subnet-b0e04bf9"
    private_b = "subnet-2731df7c"
    private_c = "subnet-8669cbe1"
  }
}

variable "default_sg" {
  default = "sg-b58565d3"
}

variable "cross_account_destination_table" {
  description = "Destination table for cross account writes."
  default     = "12345"
}

variable "audit_lambda_function_ref" {
  description = "ref for the audit lambda function, used by event source mappings."
  default     = "arn"
}

variable "load_balancer_em_timeout" {
  description = "Environment Manager load balancer timeout"
  default     = 3600
}

variable "load_balancer_em_port" {
  description = "Environment Manager load balancer port"
  default     = 9000
}

variable "load_balancer_em_health_check" {
  description = "Environment Manager load balancer health check"
  default     = "health_check"
}

variable "load_balancer_em_listener_port" {
  description = "Environment Manager load balancer listener port"
  default     = 9001
}

variable "vpc_id" {
  description = "VPC ID"
  default     = "vpc-67ab3903"
}

variable "cidr_ip" {
  description = "ELB cidr block"
  default     = "0.0.0.0/0"
}

variable "ec2_key_pair" {
  description = "EC2 Key Pair"
  default     = "key"
}

variable "em_security_groups" {
  description = "Environment Manager security groups"
  default     = [1, 2, 3, 4, 5]
}

variable "configuration_bucket" {
  description = "Environment Manager configuration bucket"
  default     = "em-daveandjake-config"
}

variable "secrets_bucket" {
  description = "Environment Manager secrets bucket"
  default     = "em-daveandjake-secure"
}

variable "backups_bucket" {
  description = "Environment Manager backups bucket"
  default     = "backups"
}

variable "deployment_logs_bucket" {
  description = "Environment Manager deployment logs bucket"
  default     = "em-testing-deploy"
}

variable "packages_bucket" {
  description = "Environment Manager packages bucket"
  default     = "em-daveandjake-packages"
}

variable "deployment_bucket" {
  description = "Environment Manager packages bucket"
  default     = "em-daveandjake-deployment"
}

variable "managed_accounts" {
  description = "Emvironment Manager managed accounts"
  default     = ["account", "account2"]
}

variable "redis_subnet_group_id" {
  description = "redis subnet group id"
  default     = "subnet-b036eed7"
}

variable "redis_port" {
  description = "redis port number"
  default     = 11211
}

variable "redis_security_group_ids" {
  description = "redis security group ids"
  default     = ["sg-4272983a"]
}

variable "vpc_base" {
  description = "vpc id base"
  default     = "vpc-67ab3903"
}

variable "destination_table" {
  description = ""
  default     = "destination table"
}

variable "role_name" {
  description = "used by lambda. role name"
  default     = "role name"
}

variable "upstream_router_execution_role" {
  description = "lambda function execution role for upstream router"
  default     = "arn value"
}
