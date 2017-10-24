'use strict';

const GetASGState = require('../queryHandlers/GetASGState');
const GetAutoScalingGroup = require('../queryHandlers/GetAutoScalingGroup');
const GetAutoScalingGroupScheduledActions = require('../queryHandlers/GetAutoScalingGroupScheduledActions');
const GetAutoScalingGroupScheduleStatus = require('../queryHandlers/GetAutoScalingGroupScheduleStatus');
const GetAutoScalingGroupSize = require('../queryHandlers/GetAutoScalingGroupSize');
const GetEnvironmentScheduleStatus = require('../queryHandlers/GetEnvironmentScheduleStatus');
const GetInstanceProfile = require('../queryHandlers/GetInstanceProfile');
const GetKeyPair = require('../queryHandlers/GetKeyPair');
const GetLaunchConfiguration = require('../queryHandlers/GetLaunchConfiguration');
const GetRole = require('../queryHandlers/GetRole');
const GetServiceNodes = require('../queryHandlers/GetServiceNodes');
const GetServicePortConfig = require('../queryHandlers/GetServicePortConfig');
const GetTopic = require('../queryHandlers/GetTopic');
const ScanAccounts = require('../queryHandlers/ScanAccounts');
const ScanAutoScalingGroups = require('../queryHandlers/ScanAutoScalingGroups');
const ScanCrossAccountAutoScalingGroups = require('../queryHandlers/ScanCrossAccountAutoScalingGroups');
const ScanCrossAccountImages = require('../queryHandlers/ScanCrossAccountImages');
const ScanCrossAccountInstances = require('../queryHandlers/ScanCrossAccountInstances');
const ScanImages = require('../queryHandlers/ScanImages');
const ScanInstances = require('../queryHandlers/ScanInstances');
const ScanInstancesScheduleStatus = require('../queryHandlers/ScanInstancesScheduleStatus');
const ScanLaunchConfigurations = require('../queryHandlers/ScanLaunchConfigurations');
const ScanNginxUpstreams = require('../queryHandlers/ScanNginxUpstreams');
const ScanSecurityGroups = require('../queryHandlers/ScanSecurityGroups');
const ScanServersStatus = require('../queryHandlers/ScanServersStatus');
const GetAllNodes = require('../queryHandlers/services/GetAllNodes');
const GetNode = require('../queryHandlers/services/GetNode');
const GetServerRoles = require('../queryHandlers/services/GetServerRoles');
const GetTargetState = require('../queryHandlers/services/GetTargetState');
const GetNodeDeploymentLog = require('../queryHandlers/deployments/GetNodeDeploymentLog');
const GetSlicesByService = require('../queryHandlers/slices/GetSlicesByService');
const GetSlicesByUpstream = require('../queryHandlers/slices/GetSlicesByUpstream');
const EnterAutoScalingGroupInstancesToStandby = require('../commands/asg/EnterAutoScalingGroupInstancesToStandby');
const ExitAutoScalingGroupInstancesFromStandby = require('../commands/asg/ExitAutoScalingGroupInstancesFromStandby');
const SetAutoScalingGroupSchedule = require('../commands/asg/SetAutoScalingGroupSchedule');
const SetAutoScalingGroupSize = require('../commands/asg/SetAutoScalingGroupSize');
const UpdateAutoScalingGroup = require('../commands/asg/UpdateAutoScalingGroup');
const GetAccountByEnvironment = require('../commands/aws/GetAccountByEnvironment');
const SetInstanceMaintenanceMode = require('../commands/aws/SetInstanceMaintenanceMode');
const CreateAutoScalingGroup = require('../commands/deployments/CreateAutoScalingGroup');
const CreateLaunchConfiguration = require('../commands/deployments/CreateLaunchConfiguration');
const DeploymentCommandHandlerLogger = require('../commands/deployments/DeploymentCommandHandlerLogger');
const DeploymentContractSchema = require('../commands/deployments/DeploymentContract.schema');
const DeployService = require('../commands/deployments/DeployService');
const GetInfrastructureRequirements = require('../commands/deployments/GetInfrastructureRequirements');
const packageMover = require('../commands/deployments/packageMover');
const PreparePackage = require('../commands/deployments/PreparePackage');
const PreparePackageCommandSchema = require('../commands/deployments/PreparePackageCommand.schema');
const ProvideInfrastructure = require('../commands/deployments/ProvideInfrastructure');
const PushDeployment = require('../commands/deployments/PushDeployment');
const S3PathContractSchema = require('../commands/deployments/S3PathContract.schema');
const launchConfigUpdater = require('../commands/launch-config/launchConfigUpdater');
const SetLaunchConfiguration = require('../commands/launch-config/SetLaunchConfiguration');
const DeleteTargetState = require('../commands/services/DeleteTargetState');
const ToggleTargetStatus = require('../commands/services/ToggleTargetStatus');
const UpdateTargetState = require('../commands/services/UpdateTargetState');
const ToggleSlicesByService = require('../commands/slices/ToggleSlicesByService');
const ToggleSlicesByUpstream = require('../commands/slices/ToggleSlicesByUpstream');
const awsAccountValidator = require('../commands/validators/awsAccountValidator');
const lbUpstreamValidator = require('../commands/validators/lbUpstreamValidator');

module.exports = {
  GetASGState,
  GetAutoScalingGroup,
  GetAutoScalingGroupScheduledActions,
  GetAutoScalingGroupScheduleStatus,
  GetAutoScalingGroupSize,
  GetEnvironmentScheduleStatus,
  GetInstanceProfile,
  GetKeyPair,
  GetLaunchConfiguration,
  GetRole,
  GetServiceNodes,
  GetServicePortConfig,
  GetTopic,
  ScanAccounts,
  ScanAutoScalingGroups,
  ScanCrossAccountAutoScalingGroups,
  ScanCrossAccountImages,
  ScanCrossAccountInstances,
  ScanImages,
  ScanInstances,
  ScanInstancesScheduleStatus,
  ScanLaunchConfigurations,
  ScanNginxUpstreams,
  ScanSecurityGroups,
  ScanServersStatus,
  GetAllNodes,
  GetNode,
  GetServerRoles,
  GetTargetState,
  GetNodeDeploymentLog,
  GetSlicesByService,
  GetSlicesByUpstream,
  EnterAutoScalingGroupInstancesToStandby,
  ExitAutoScalingGroupInstancesFromStandby,
  SetAutoScalingGroupSchedule,
  SetAutoScalingGroupSize,
  UpdateAutoScalingGroup,
  GetAccountByEnvironment,
  SetInstanceMaintenanceMode,
  CreateAutoScalingGroup,
  CreateLaunchConfiguration,
  DeploymentCommandHandlerLogger,
  'DeploymentContract.schema': DeploymentContractSchema,
  DeployService,
  GetInfrastructureRequirements,
  packageMover,
  PreparePackage,
  'PreparePackageCommand.schema': PreparePackageCommandSchema,
  ProvideInfrastructure,
  PushDeployment,
  'S3PathContract.schema': S3PathContractSchema,
  launchConfigUpdater,
  SetLaunchConfiguration,
  DeleteTargetState,
  ToggleTargetStatus,
  UpdateTargetState,
  ToggleSlicesByService,
  ToggleSlicesByUpstream,
  awsAccountValidator,
  lbUpstreamValidator
};
