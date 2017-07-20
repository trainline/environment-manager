resource "aws_autoscaling_group" "app" {
  vpc_zone_identifier       = ["${var.subnet_ids["private_a"]}", "${var.subnet_ids["private_b"]}", "${var.subnet_ids["private_c"]}"]
  name                      = "${var.stack}-${var.app}"
  max_size                  = 5
  min_size                  = 2
  health_check_grace_period = 30
  health_check_type         = "ELB"
  desired_capacity          = 2
  force_delete              = true
  launch_configuration      = "${aws_launch_configuration.app.name}"
}

resource "aws_launch_configuration" "app" {
  name_prefix          = "${var.stack}-${var.app}-"
  image_id             = "${data.aws_ami.ubuntu.id}"
  instance_type        = "t2.micro"
  key_name             = "em-testing-master-keypair-2"
  iam_instance_profile = "${aws_iam_instance_profile.app.id}"
  user_data            = "SOMETHING::${var.something}\n${file("${path.module}/scripts/app/user-data.sh")}"

  lifecycle {
    create_before_destroy = true
  }
}
