resource "aws_lambda_function" "cache_reset" {
  filename         = "cache_reset.zip"
  function_name    = "cacheReset"
  role             = "${aws_iam_role.cache_reset.arn}"
  handler          = "index.handler"
  source_code_hash = "${base64sha256(file("cache_reset.zip"))}"
  runtime          = "nodejs6.10"
}