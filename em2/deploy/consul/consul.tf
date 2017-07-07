terraform {
  backend "s3" {
    bucket = "daveandjake-remote-state"
    key    = "state-consul"
    region = "eu-west-1"
  }
}

data "terraform_remote_state" "remote-state" {
  backend = "s3"

  config {
    bucket = "daveandjake-remote-state"
    key    = "state-consul"
    region = "eu-west-1"
  }
}

resource "aws_instance" "server" {
  ami           = "${lookup(var.ami, "${var.region}-${var.platform}")}"
  instance_type = "${var.instance_type}"
  key_name      = "${var.key_name}"

  count                  = "${var.servers}"
  vpc_security_group_ids = ["${aws_security_group.consul.id}"]
  subnet_id              = "${var.subnet_id}"

  connection {
    type         = "ssh"
    user         = "${lookup(var.user, var.platform)}"
    private_key  = "${file("${var.key_path}")}"
    bastion_host = "34.250.64.29"
    bastion_port = 22
    bastion_user = "${lookup(var.user, var.platform)}"

    # bastion_password = ""
    bastion_private_key = "${file("${var.key_path}")}"
  }

  #Instance tags
  tags {
    Name       = "${var.tagName}-${count.index}"
    ConsulRole = "Server"
  }

  provisioner "file" {
    source      = "${path.module}/scripts/${lookup(var.service_conf, var.platform)}"
    destination = "/tmp/${lookup(var.service_conf_dest, var.platform)}"
  }

  provisioner "remote-exec" {
    inline = [
      "echo ${var.datacenter} > /tmp/consul-datacenter",
      "echo ${var.servers} > /tmp/consul-server-count",
      "echo ${aws_instance.server.0.private_dns} > /tmp/consul-server-addr",
    ]
  }

  provisioner "remote-exec" {
    scripts = [
      "${path.module}/scripts/install.sh",
      "${path.module}/scripts/service.sh",
      "${path.module}/scripts/iptables.sh",
    ]
  }
}

resource "aws_security_group" "consul" {
  name        = "consul_${var.platform}"
  description = "Consul internal traffic + maintenance."
  vpc_id      = "${var.vpc_id}"

  // These are for internal consul traffic
  ingress {
    from_port = 8300
    to_port   = 8302
    protocol  = "tcp"
    self      = true
  }

  ingress {
    from_port = 8400
    to_port   = 8400
    protocol  = "tcp"
    self      = true
  }

  ingress {
    from_port = 8500
    to_port   = 8500
    protocol  = "tcp"
    self      = true
  }

  // These are for maintenance
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  // This is for outbound internet access
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
