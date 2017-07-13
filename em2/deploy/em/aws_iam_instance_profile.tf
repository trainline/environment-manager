resource "aws_iam_instance_profile" "instanceProfileEnvironmentManager" {
  name = "instanceProfileEnvironmentManager"
  role = "${aws_iam_role.roleInfraEnvironmentManager.name}"
  path = "/EnvironmentManager/"
}
