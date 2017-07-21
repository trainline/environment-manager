resource "aws_network_acl" "main" {
  vpc_id = "${aws_vpc.main.id}"

  subnet_ids = ["${var.subnet_cidr["public_a"]}",
    "${var.subnet_cidr["public_b"]}",
    "${var.subnet_cidr["public_c"]}",
    "${var.subnet_cidr["private_a"]}",
    "${var.subnet_cidr["private_b"]}",
    "${var.subnet_cidr["private_c"]}",
  ]

  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "${var.nacl_ingress_cidr}"
  }

  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "${var.nacl_egress_cidr}"
  }

  tags {
    Name = "main"
  }
}
