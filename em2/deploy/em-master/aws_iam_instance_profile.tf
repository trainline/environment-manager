resource "aws_iam_instance_profile" "app" {
  name = "${var.stack}-app"
  role = "${aws_iam_role.app.name}"
}
