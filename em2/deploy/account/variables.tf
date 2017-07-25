# aws_vpc

variable "vpc_cidr" {}

variable "vpc_name" {}

# aws_vpc_dhcp_options

variable "vpc_dhcp_domain_name" {}

variable "vpc_dhcp_domain_name_servers" {}

# aws_default_route_table

variable "default_route_table_cidr" {}

# aws_subnet
variable "subnet_availability_zones" {
  type = "map"
}

variable "subnet_cidr" {
  type = "map"
}

# Other

variable "configuration_key" {
  description = "The configuration file to be used by Environment Manager"
  default     = "config.json"
}

variable "secure_bucket" {
  description = "Consul ACL token storage"
  default     = "em-daveandjake-secure"
}

variable "backups_bucket" {
  description = "NO IDEA"
  default     = "backups"
}

variable "deployment_logs_bucket" {
  description = "Storage for Environment Manager Logs"
  default     = "em-daveandjake-logs"
}

variable "packages_bucket" {
  description = "PACKAGES VS DEPLOYMENT?"
  default     = "em-daveandjake-packages"
}

variable "deployment_bucket" {
  description = "PACKAGES VS DEPLOYMENT?"
  default     = "em-daveandjake-deployment"
}

variable "init_script_bucket" {
  description = "Initialization scripts for Environment Manager AMIs"
  default     = "em-testing-init"
}

variable "em_release_bucket" {
  description = "Environment Manager release packages"
  default     = "environment-manager-releases"
}

variable "em_release_key" {
  description = "key for the environment manager to download from s3"
  default     = "environment-manager/environment-manager-5.0.0.zip"
}
