/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').factory('resources',
  function (localResourceFactory, remoteResourceFactory, roles) {
    var securityZones = ['Other', 'Public', 'Sensitive', 'Management', 'Secure'];
    var deploymentMethods = [
      { Name: 'Overwrite', Value: 'overwrite' },
      { Name: 'Blue/Green', Value: 'bg' }
    ];
    var deploymentStatus = ['In Progress', 'Success', 'Failed', 'Cancelled'];
    var awsInstanceTypes = ['c3.2xlarge', ' c3.4xlarge', 'c3.large', 'c3.xlarge', 'c4.2xlarge', 'c4.4xlarge', 'c4.8xlarge', 'c4.large', 'c4.xlarge', 'd2.2xlarge', 'd2.4xlarge', 'd2.8xlarge', 'd2.xlarge', 'i2.2xlarge', 'i2.4xlarge', 'i2.8xlarge', 'i2.xlarge', ' m3.2xlarge', 'm3.large', 'm3.medium', 'm3.xlarge', 'm4.2xlarge', 'm4.4xlarge', 'm4.large', 'm4.xlarge', 'r3.2xlarge', 'r3.4xlarge', 'r3.large', 'r3.xlarge', 'r4.large', 'r4.xlarge', 'r4.2xlarge', 'r4.4xlarge', 't2.2xlarge', 't2.large', 't2.medium', 't2.micro', 't2.small', 't2.xlarge'].sort();
    var auditChangeTypes = ['Created', 'Deleted', 'Updated', 'Renamed'];
    var auditEntityTypes = [
      { Name: 'Deployment Map', Value: 'ConfigDeploymentMaps' },
      { Name: 'Environment', Value: 'ConfigEnvironments' },
      { Name: 'Environment Type', Value: 'ConfigEnvironmentTypes' },
      { Name: 'LB Setting', Value: 'ConfigLBSettings' },
      { Name: 'LB Upstream', Value: 'ConfigLBUpstream' },
      { Name: 'Service', Value: 'ConfigServices' },
      { Name: 'Cluster', Value: 'InfraConfigClusters' },
      { Name: 'Permissions', Value: 'InfraConfigPermissions' },
      { Name: 'Accounts', Value: 'InfraConfigAccounts' },
      { Name: 'Notification Settings', Value: 'ConfigNotificationSettings' }
    ];

    var environmentAlertSettingsList = [
      { Name: 'Environment Owner', Value: 'EnvironmentOwner' },
      { Name: 'Service Owner', Value: 'ServiceOwner' },
      { Name: 'Custom', Value: 'Custom' },
    ];

    var resources = {
      config: {
        accounts: remoteResourceFactory.getFullAccess({
          name: 'accounts',
          description: 'AWS Accounts',
          section: 'config',
          perAccount: true
        }),
        environments: remoteResourceFactory.getFullAccess({
          name: 'environments',
          description: 'Environments',
          section: 'config',
          perAccount: false
        }),
        environmentTypes: remoteResourceFactory.getFullAccess({
          name: 'environment-types',
          description: 'Environment Types',
          section: 'config',
          perAccount: false
        }),
        deploymentMaps: remoteResourceFactory.getFullAccess({
          name: 'deployment-maps',
          description: 'Deployment Maps',
          section: 'config',
          perAccount: false
        }),
        services: remoteResourceFactory.getFullAccess({
          name: 'services',
          description: 'Services',
          section: 'config',
          perAccount: false
        }),
        permissions: remoteResourceFactory.getFullAccess({
          name: 'permissions',
          description: 'Permissions',
          section: 'config',
          perAccount: false
        }),
        lbSettings: remoteResourceFactory.getFullAccess({
          name: 'lb-settings',
          description: 'Load Balancer Settings',
          section: 'config',
          perAccount: true
        }),
        lbUpstream: remoteResourceFactory.getFullAccess({
          name: 'upstreams',
          description: 'Load Balancer Upstream',
          section: 'config',
          perAccount: true
        }),
        clusters: remoteResourceFactory.getFullAccess({
          name: 'clusters',
          description: 'Clusters',
          section: 'config',
          perAccount: false
        })

      },
      aws: {
        instances: remoteResourceFactory.getReadOnly({
          name: 'instances',
          description: 'EC2 Instances',
          perAccount: true
        }),
        images: remoteResourceFactory.getReadOnly({
          name: 'images',
          description: 'AWS Images',
          perAccount: true
        }),
        instanceTypes: localResourceFactory(awsInstanceTypes)
      },
      asgips: remoteResourceFactory.getFullAccess({
        name: 'asgips',
        description: 'Auto Scaling Group IPs',
        perAccount: true
      }),
      audit: {
        history: remoteResourceFactory.getReadOnly({
          name: 'audit',
          perAccount: true
        }),
        entityTypes: localResourceFactory(auditEntityTypes),
        changeTypes: localResourceFactory(auditChangeTypes)
      },
      deployments: remoteResourceFactory.getReadOnly({
        name: 'deployments',
        perAccount: true
      }),
      deployment: {
        methods: localResourceFactory(deploymentMethods),
        statuses: localResourceFactory(deploymentStatus)
      },
      environmentAlertSettingsList: environmentAlertSettingsList,
      securityZones: localResourceFactory(securityZones),
      roles: roles
    };

    return resources;
  });

