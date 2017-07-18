resource "aws_instance" "environment-manager" {
  ami                    = "ami-a8d2d7ce"
  instance_type          = "t2.medium"
  key_name               = "em-testing-master-keypair-2"
  count                  = 1
  vpc_security_group_ids = ["${aws_security_group.sgInfraEnvironmentManager.id}"]
  subnet_id              = "${var.subnet_ids["private_a"]}"

  connection {
    type                = "ssh"
    user                = "ubuntu"
    private_key         = "${file("~/.ssh/em-testing-master-keypair-2.pem")}"
    bastion_host        = "34.250.64.29"
    bastion_port        = 22
    bastion_user        = "ubuntu"
    bastion_private_key = "${file("~/.ssh/em-testing-master-keypair-2.pem")}"
  }

  # Create all variables required by scripts in the /tmp/em folder.
  provisioner "remote-exec" {
    inline = [
      "mkdir -p /tmp/em/",
      "echo ${data.aws_region.current.name} > /tmp/em/EM_AWS_REGION",
      "echo em-daveandjake-config > /tmp/em/EM_AWS_S3_BUCKET",
      "echo config.json > /tmp/em/EM_AWS_S3_KEY",
      "echo em-daveandjake-packages > /tmp/em/EM_PACKAGES_BUCKET",
      "echo packages > /tmp/em/EM_PACKAGES_KEY_PREFIX",
      "echo em-cache-cluster.qcyyv8.0001.euw1.cache.amazonaws.com > /tmp/em/EM_REDIS_ADDRESS",
      "echo 11211 > /tmp/em/EM_REDIS_PORT",
      "echo abcdefg > /tmp/em/EM_REDIS_CRYPTO_KEY",
      "echo true > /tmp/em/IS_PRODUCTION",
      "echo ${data.aws_region.current.name} > /tmp/em/AWS_REGION",
    ]
  }

  provisioner "remote-exec" {
    scripts = [
      "${path.module}/scripts/environment-manager-env-variables.sh",
      "${path.module}/scripts/install_consul.sh",
    ]
  }
}
