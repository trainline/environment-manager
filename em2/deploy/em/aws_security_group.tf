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
