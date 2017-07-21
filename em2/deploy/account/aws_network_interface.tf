resource "aws_network_interface" "network_interface" {
  subnet_id       = "${aws_subnet.public_a.id}"
  private_ips     = ["10.0.0.50"]
  security_groups = ["${aws_security_group.web.id}"]

  attachment {
    instance     = "${aws_instance.test.id}"
    device_index = 1
  }
}
