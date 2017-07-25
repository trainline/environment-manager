resource "aws_security_group" "app" {
  name   = "${var.stack}-${var.app}"
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "${var.stack}-${var.app}"
  }

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["${var.app_sg_cidr_inbound}"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["${var.app_sg_cidr_outbound}"]
  }
}

resource "aws_security_group" "elb" {
  name   = "${var.stack}-${var.app}-elb"
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "${var.stack}-${var.app}-elb"
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "redis_access" {
  name   = "${var.stack}-${var.app}-redis-access"
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "${var.stack}-${var.app}-redis-access"
  }
}

resource "aws_security_group" "redis_host" {
  name   = "${var.stack}-${var.app}-redis-host"
  vpc_id = "${var.vpc_id}"

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

resource "aws_security_group" "scheduler_sg" {
  name        = "${var.stack}-${var.app}-scheduler"
  description = "Allow all outbound traffic"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
