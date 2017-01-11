'use strict';

module.exports = {

  DEPLOYMENT_INSTANCES_LIST_MAXIMUM_LENGTH: 300,

  SourcePackageType: {
    CodeDeployRevision: 'CodeDeployRevision',
    DeploymentMap: 'DeploymentMap'
  },

  DeploymentMode: {
    Overwrite: 'overwrite',
    BlueGreen: 'bg'
  },

  SliceName: {
    Blue: 'blue',
    Green: 'green'
  },

  DIFF_STATE: {
    Ignored: 'Ignored',
    Missing: 'Missing',
    Unexpected: 'Unexpected'
  },

  HEALTH_STATUS: {
    Healthy: 'Healthy',
    Warning: 'Warning',
    Error: 'Error',
    NoData: 'NoData',
    Unknown: 'Unknown',
    Missing: 'Missing'
  },

  ASGLifecycleState: {
    IN_SERVICE: 'InService'
  },

  NodeDeploymentStatus: {
    NotStarted: 'Not Started',
    InProgress: 'In Progress',
    Success: 'Success',
    Failed: 'Failed'
  },

  DEPLOYMENT_STATUS: {
    InProgress: 'In Progress',
    Success: 'Success',
    Failed: 'Failed',
    Cancelled: 'Cancelled',
    Unknown: 'Unknown'
  },

  AutoScalingNotificationType: {
    InstanceLaunch: 'autoscaling:EC2_INSTANCE_LAUNCH',
    InstanceLaunchError: 'autoscaling:EC2_INSTANCE_LAUNCH_ERROR',
    InstanceTerminate: 'autoscaling:EC2_INSTANCE_TERMINATE',
    InstanceTerminateError: 'autoscaling:EC2_INSTANCE_TERMINATE_ERROR'
  },

  LifecycleHookType: {
    InstanceLaunching: 'autoscaling:EC2_INSTANCE_LAUNCHING',
    InstanceTerminating: 'autoscaling:EC2_INSTANCE_TERMINATING'
  },

  LifecycleHookDefaultResult: {
    Continue: 'CONTINUE',
    Abandon: 'ABANDON'
  },

  ServiceAction: {
    INSTALL: 'Install',
    IGNORE: 'Ignore'
  }
};
