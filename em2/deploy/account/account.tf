resource "aws_s3_bucket" "config_bucket" {
  bucket = "${var.configuration_bucket}"
  acl    = "private"

  tags {
    Name = "em-daveandjake-config"
  }
}

resource "aws_s3_bucket" "secure_bucket" {
  bucket = "${var.secure_bucket}"
  acl    = "private"

  tags {
    Name = "em-daveandjake-secure"
  }
}

resource "aws_s3_bucket" "packages_bucket" {
  bucket = "${var.packages_bucket}"
  acl    = "private"

  tags {
    Name = "em-daveandjake-packages"
  }
}

resource "aws_s3_bucket" "logs_bucket" {
  bucket = "${var.deployment_logs_bucket}"
  acl    = "private"

  tags {
    Name = "em-daveandjake-logs"
  }
}

resource "aws_s3_bucket" "newco_environment_manager_public" {
  bucket = "${var.init_script_bucket}"
  acl    = "private"

  tags {
    Name = "em-testing-init"
  }
}
