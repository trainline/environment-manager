variable "configuration_bucket" {}

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