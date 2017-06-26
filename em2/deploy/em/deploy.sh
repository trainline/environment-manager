#!/usr/bin/env bash

echo "Terraform Plan"
terraform plan \
  && echo "Terraform Apply" \
  && terraform apply \
  && tableInfraConfigLbSettings_stream_arn=$(terraform output tableInfraConfigLbSettings_stream_arn) \
  && lambdaInfraEnvironmentManagerLbSettingsRouter_id=$(terraform output lambdaInfraEnvironmentManagerLbSettingsRouter_id) \
  && lambdaInfraEnvironmentManagerAudit_id=$(terraform output lambdaInfraEnvironmentManagerAudit_id) \
  && ConfigNotificationSettings_stream_arn=$(terraform output ConfigNotificationSettings_stream_arn)

INFRACONFIGSETTINGS_VAR="variable \"tableInfraConfigLbSettings_stream_arn\" {
  description = \"\"
  default = \""${tableInfraConfigLbSettings_stream_arn}\""
}"

ENVIRONMENTMANAGERLBSETTINGSROUTER_VAR="variable \"lambdaInfraEnvironmentManagerLbSettingsRouter_id\" {
  description = \"\"
  default = \""${lambdaInfraEnvironmentManagerLbSettingsRouter_id}\""
}"

INFRAENVIRONMENTMANAGERLBSETTINGSROUTER_VAR="variable \"lambdaInfraEnvironmentManagerAudit_id\" {
  description = \"\"
  default = \""${lambdaInfraEnvironmentManagerAudit_id}\""
}"

CONFIGNOTIFICATIONSETTINGS_VAR="variable \"ConfigNotificationSettings_stream_arn\" {
  description = \"\"
  default = \""${ConfigNotificationSettings_stream_arn}\""
}"



echo "Creating copy of variables..."
cp step/variables.tf step/variables.tf.backup
echo "Removing existing variables..."
rm step/variables.tf

echo "Creating new variables file with output values..."
echo "variable \"audit_lambda_function_ref\" {
  description = \"ref for the audit lambda function, used by event source mappings.\"
  default     = \"arn\"
}" >> step/variables.tf

echo "${INFRACONFIGSETTINGS_VAR}" >> step/variables.tf
echo "${ENVIRONMENTMANAGERLBSETTINGSROUTER_VAR}" >> step/variables.tf
echo "${INFRAENVIRONMENTMANAGERLBSETTINGSROUTER_VAR}" >> step/variables.tf
echo "${CONFIGNOTIFICATIONSETTINGS_VAR}" >> step/variables.tf

cd step

terraform plan
terraform apply
cd ..