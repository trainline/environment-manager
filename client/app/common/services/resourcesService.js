/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').factory('resources',
  function (localResourceFactory, remoteResourceFactory, nginxResourceFactory, autoScalingGroupResourceFactory, environments, roles, servers) {

    var securityZones = ['Other', 'Public', 'Sensitive', 'Management', 'Secure'];
    var deploymentMethods = [
      { Name: 'Overwrite', Value: 'overwrite' },
      { Name: 'Blue/Green', Value: 'bg' },
    ];
    var deploymentStatus = ['In Progress', 'Success', 'Failed'];
    var awsInstanceTypes = ['t2.nano', 't2.micro', 't2.small', 't2.medium', 't2.large', 'm4.large', 'm4.xlarge', 'm4.2xlarge', 'm4.4xlarge', 'm3.medium', 'm3.large', 'm3.xlarge', 'm3.2xlarge', 'c4.large', 'c4.xlarge', 'c4.2xlarge', 'c4.4xlarge', 'c4.8xlarge', 'c3.large', 'c3.xlarge', 'c3.2xlarge', 'c3.4xlarge', 'c3.8xlarge', 'r3.large', 'r3.xlarge', 'r3.2xlarge', 'r3.4xlarge', 'r3.8xlarge', 'i2.xlarge', 'i2.2xlarge', 'i2.4xlarge', 'i2.8xlarge', 'd2.xlarge', 'd2.2xlarge', 'd2.4xlarge', 'd2.8xlarge'].sort();
    var auditChangeTypes = ['Created', 'Deleted', 'Updated', 'Renamed'];
    var auditEntityTypes = [
      { Name: 'Deployment Map', Value: 'ConfigDeploymentMaps' },
      { Name: 'Environment', Value: 'ConfigEnvironments' },
      { Name: 'Environment Type', Value: 'ConfigEnvironmentTypes' },
      { Name: 'LB Setting', Value: 'ConfigLBSettings' },
      { Name: 'LB Upstream', Value: 'ConfigLBUpstream' },
      { Name: 'Service', Value: 'ConfigServices' },
      { Name: 'Cluster', Value: 'InfraConfigClusters' },
    ];

    var resources = {
      config: {
        accounts: remoteResourceFactory.getFullAccess({
          name: 'accounts',
          description: 'AWS Accounts',
          section: 'aws',
          perAccount: true,
        }),
        environments: remoteResourceFactory.getFullAccess({
          name: 'environments',
          description: 'Environments',
          section: 'config',
          perAccount: false,
        }),
        environmentTypes: remoteResourceFactory.getFullAccess({
          name: 'environmentTypes',
          description: 'Environment Types',
          section: 'config',
          perAccount: false,
        }),
        deploymentMaps: remoteResourceFactory.getFullAccess({
          name: 'deploymentMaps',
          description: 'Deployment Maps',
          section: 'config',
          perAccount: false,
        }),
        services: remoteResourceFactory.getFullAccess({
          name: 'services',
          description: 'Services',
          section: 'config',
          perAccount: false,
        }),
        permissions: remoteResourceFactory.getFullAccess({
          name: 'permissions',
          description: 'Permissions',
          section: 'config',
          perAccount: false,
        }),
        lbSettings: remoteResourceFactory.getFullAccess({
          name: 'lbSettings',
          description: 'Load Balancer Settings',
          section: 'config',
          perAccount: true,
        }),
        lbUpstream: remoteResourceFactory.getFullAccess({
          name: 'lbUpstream',
          description: 'Load Balancer Upstream',
          section: 'config',
          perAccount: true,
        }),
        clusters: remoteResourceFactory.getFullAccess({
          name: 'clusters',
          description: 'Clusters',
          section: 'config',
          perAccount: false,
        }),

      },
      environment: environments,
      ops: {
        environments: remoteResourceFactory.getFullAccess({
          name: 'environments',
          description: 'Environments',
          section: 'ops',
          perAccount: false,
        }),
      },
      aws: {
        accounts: remoteResourceFactory.getReadOnly({
          name: 'accounts',
          perAccount: false,
        }),
        instances: remoteResourceFactory.getReadOnly({
          name: 'instances',
          description: 'EC2 Instances',
          perAccount: true,
        }),
        images: remoteResourceFactory.getReadOnly({
          name: 'images',
          description: 'AWS Images',
          perAccount: true,
        }),
        asgs: autoScalingGroupResourceFactory,
        instanceTypes: localResourceFactory(awsInstanceTypes),
      },
      asgips: remoteResourceFactory.getFullAccess({
        name: 'asgips',
        description: 'Auto Scaling Group IPs',
        perAccount: true,
      }),
      audit: {
        history: remoteResourceFactory.getReadOnly({
          name: 'audit',
          perAccount: true,
        }),
        entityTypes: localResourceFactory(auditEntityTypes),
        changeTypes: localResourceFactory(auditChangeTypes),
      },
      deployments: remoteResourceFactory.getReadOnly({
        name: 'deployments',
        perAccount: true,
      }),
      deployment: {
        methods: localResourceFactory(deploymentMethods),
        statuses: localResourceFactory(deploymentStatus),
      },
      nginx: nginxResourceFactory.get({
        name: 'nginx',
        description: 'Nginx upstreams',
      }),
      securityZones: localResourceFactory(securityZones),
      roles: roles,
      servers: servers,
    };

    return resources;

  });
