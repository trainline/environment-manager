resource "aws_security_group" "app" {
  name   = "${var.stack}"
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "${var.stack}"
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
  name   = "${var.stack}-elb"
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "${var.stack}-elb"
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
  name   = "${var.stack}-redis-access"
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "${var.stack}-redis-access"
  }
}

resource "aws_security_group" "redis_host" {
  name   = "${var.stack}-redis-host"
  vpc_id = "${var.vpc_id}"

  tags = {
    Name = "${var.stack}-redis-host"
  }

  ingress {
    protocol  = "tcp"
    self      = true
    from_port = "${aws_elasticache_cluster.cache-cluster.cache_nodes.0.port}"
    to_port   = "${aws_elasticache_cluster.cache-cluster.cache_nodes.0.port}"
  }
}

resource "aws_security_group" "scheduler_sg" {
  name        = "${var.stack}-scheduler"
  description = "Allow all outbound traffic"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
