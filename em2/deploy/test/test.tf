provider "aws" {}

resource "aws_dynamodb_table" "basic-dynamodb-table" {
  name           = "GameScores"
  read_capacity  = 20
  write_capacity = 20
  hash_key       = "UserId"
  range_key      = "GameTitle"
  stream_enabled = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "UserId"
    type = "S"
  }

  attribute {
    name = "GameTitle"
    type = "S"
  }

  ttl {
    attribute_name = "TimeToExist"
    enabled = false
  }

  tags {
    Name        = "dynamodb-table-1"
    Environment = "production"
  }
}

resource "aws_lambda_event_source_mapping" "event_source_mapping" {
  batch_size        = 100
  event_source_arn  = "${aws_dynamodb_table.basic-dynamodb-table.stream_arn}"
  enabled           = true
  function_name     = "arn:aws:lambda:eu-west-1:825904718481:function:InfraAsgScale"
  starting_position = "LATEST"
}
