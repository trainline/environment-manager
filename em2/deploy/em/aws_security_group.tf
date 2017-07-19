resource "aws_security_group" "app" {
  name   = "${var.stack}-${var.app}"
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "${var.stack}-${var.app}"
  }
}

resource "aws_security_group" "elb" {
  name   = "${var.stack}-${var.app}-elb"
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "${var.stack}-${var.app}-elb"
  }
}

resource "aws_security_group" "redis_access" {
  name   = "${var.stack}-${var.app}-redis-access"
  vpc_id = "${var.vpc_base}"

  tags = {
    Name = "${var.stack}-${var.app}-redis-access"
  }
}

resource "aws_security_group" "redis_host" {
  name   = "${var.stack}-${var.app}-redis-host"
  vpc_id = "${var.vpc_base}"

  tags = {
    Name = "${var.stack}-${var.app}-redis-host"
  }

  ingress {
    protocol  = "tcp"
    self      = true
    from_port = "${var.redis_port}"
    to_port   = "${var.redis_port}"
  }
}
