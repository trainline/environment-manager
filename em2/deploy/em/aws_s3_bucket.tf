resource "aws_s3_bucket" "config-bucket" {
  bucket = "${var.configuration_bucket}"
  acl    = "private"

  tags {
    Name = "em-daveandjake-config"
  }
}

resource "aws_s3_bucket" "secure-bucket" {
  bucket = "${var.secrets_bucket}"
  acl    = "private"

  tags {
    Name = "em-daveandjake-secure"
  }
}

resource "aws_s3_bucket" "deployment_bucket" {
  bucket = "${var.deployment_bucket}"
  acl    = "private"

  tags {
    Name = "em-daveandjake-deployment"
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

resource "aws_s3_bucket" "em-testing-init" {
  bucket = "${var.init_script_bucket}"
  acl    = "private"

  tags {
    Name = "em-testing-init"
  }
}
