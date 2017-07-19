resource "aws_instance" "environment-manager" {
  ami                    = "ami-a8d2d7ce"
  instance_type          = "t2.medium"
  key_name               = "em-testing-master-keypair-2"
  count                  = 1
  vpc_security_group_ids = ["${aws_security_group.sg_environment_manager.id}"]
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
      "echo ${var.configuration_bucket} > /tmp/em/EM_AWS_S3_BUCKET",
      "echo ${var.configuration_key} > /tmp/em/EM_AWS_S3_KEY",
      "echo ${var.packages_bucket} > /tmp/em/EM_PACKAGES_BUCKET",
      "echo ${var.packages_key_prefix} > /tmp/em/EM_PACKAGES_KEY_PREFIX",
      "echo ${var.redis_address} > /tmp/em/EM_REDIS_ADDRESS",
      "echo ${var.redis_port} > /tmp/em/EM_REDIS_PORT",
      "echo ${var.redis_crypto_key} > /tmp/em/EM_REDIS_CRYPTO_KEY",
      "echo ${var.is_production} > /tmp/em/IS_PRODUCTION",
      "echo ${data.aws_region.current.name} > /tmp/em/AWS_REGION",
    ]
  }

  provisioner "remote-exec" {
    scripts = [
      "${path.module}/scripts/environment-manager-env-variables.sh",
      "${path.module}/scripts/install_environment_manager.sh",
      "${path.module}/scripts/install_consul.sh",
    ]
  }
}
