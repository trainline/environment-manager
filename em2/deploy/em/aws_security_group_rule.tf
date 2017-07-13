resource "aws_security_group_rule" "sgiInfraEnvironmentManagerElbTcp443fromInternalSubnet" {
  type        = "ingress"
  from_port   = "${var.load_balancer_em_port}"
  to_port     = "${var.load_balancer_em_port}"
  protocol    = "tcp"
  cidr_blocks = ["${var.cidr_ip}"]

  security_group_id = "${aws_security_group.sgInfraEnvironmentManagerElb.id}"
}
