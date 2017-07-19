resource "aws_security_group" "sg_environment_manager" {
  name   = "sg-${var.stack}-environment-manager"
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "sg-${var.stack}-environment-manager"
  }
}

resource "aws_security_group" "sg_environment_manager_elb" {
  name   = "sg-${var.stack}-environment-manager-elb"
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "sg-${var.stack}-environment-manager-elb"
  }
}

resource "aws_security_group" "sg-environment-manager-redis-access" {
  name   = "sg-${var.stack}-environment-manager-redis"
  vpc_id = "${var.vpc_base}"

  tags = {
    Name = "sg-${var.stack}-environment-manager-redis"
  }
}

resource "aws_security_group" "sg-environment-manager-redis-host" {
  name   = "sg-${var.stack}-environment-manager-redis-host"
  vpc_id = "${var.vpc_base}"

  tags = {
    Name = "sg-${var.stack}-environment-manager-redis-host"
  }

  ingress {
    protocol  = "tcp"
    self      = true
    from_port = "${var.redis_port}"
    to_port   = "${var.redis_port}"
  }
}
