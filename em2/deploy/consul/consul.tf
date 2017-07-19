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
    type        = "ssh"
    user        = "${lookup(var.user, var.platform)}"
    private_key = "${file("${var.key_path}")}"
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

  # Server RPC (Default 8300). This is used by servers to handle incoming requests from other agents. TCP only
  ingress {
    from_port = 8300
    to_port   = 8300
    protocol  = "tcp"
    self      = true
  }

  # Serf LAN (Default 8301). This is used to handle gossip in the LAN. Required by all agents. TCP and UDP
  ingress {
    from_port = 8301
    to_port   = 8301
    protocol  = "tcp"
    self      = true
  }

  ingress {
    from_port = 8301
    to_port   = 8301
    protocol  = "udp"
    self      = true
  }

  # Serf WAN (Default 8302). This is used by servers to gossip over the WAN to other servers. TCP and UDP
  ingress {
    from_port = 8301
    to_port   = 8301
    protocol  = "tcp"
    self      = true
  }

  ingress {
    from_port = 8301
    to_port   = 8301
    protocol  = "udp"
    self      = true
  }

  # CLI RPC (Default 8400). This is used by all agents to handle RPC from the CLI. TCP only
  ingress {
    from_port = 8400
    to_port   = 8400
    protocol  = "tcp"
    self      = true
  }

  # HTTP API (Default 8500). This is used by clients to talk to the HTTP API. TCP only
  ingress {
    from_port = 8500
    to_port   = 8500
    protocol  = "tcp"
    self      = true
  }

  # DNS Interface (Default 8600). Used to resolve DNS queries. TCP and UDP
  ingress {
    from_port = 8600
    to_port   = 8600
    protocol  = "tcp"
    self      = true
  }

  ingress {
    from_port = 8600
    to_port   = 8600
    protocol  = "udp"
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
