resource "aws_launch_configuration" "launchConfigEnvironmentManager" {
  iam_instance_profile = "${aws_iam_instance_profile.instanceProfileEnvironmentManager.id}"
  image_id             = "${data.aws_ami.ubuntu.id}"
  enable_monitoring    = true
  instance_type        = "t2.micro"
  security_groups      = ["${list(aws_security_group.sgInfraEnvironmentManager.id)}"]
  user_data            = "#!/usr/bin/env bash \n echo HELLO WORLD > /var/log/userdata.stdout.txt"

  lifecycle {
    create_before_destroy = true
  }
}
