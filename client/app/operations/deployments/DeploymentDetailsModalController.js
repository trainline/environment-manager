/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

// TODO(filip): refactor
function deploymentView(deploymentRecord, clusters) {

  function getDuration() {
    var startTime = moment(deployment.StartTimestamp);

    if (deployment.Status.toLowerCase() === 'in progress') {
      return {
        label: 'Started',
        value: startTime.fromNow() + ' (' + startTime.format('YYYY-MM-DD HH:mm:ss') + ')',
      };
    }

    var endTime = moment(deployment.EndTimestamp);
    var diff = moment(endTime.diff(startTime)).format('m[m] s[s]');

    return {
      label: 'Duration',
      value: diff + ' (' + startTime.format('YYYY-MM-DD, HH:mm:ss') + ' - ' + endTime.format('HH:mm:ss') + ')',
    };
  }

  function getError() {
    if (deployment.ErrorReason) {
      return {
        error: deployment.ErrorReason,
        detail: deployment.ErrorDetail,
      };
    }
  }

  function getStatusClass(status) {
    return 'status-' + status.toLowerCase().replace(' ', '-');
  }

  function getNodeDuration(node) {

    if (node.Status.toLowerCase() === 'not started' || !node.StartTime) return 'Not started';

    var startTime = moment(moment.utc(node.StartTime).toDate());
    var endTime = node.EndTime ? moment(moment.utc(node.EndTime).toDate()) : moment();

    var startEnd = startTime.format('HH:mm:ss');
    if (endTime) startEnd += ' - ' + endTime.format('HH:mm:ss');

    var duration = moment(endTime.diff(startTime)).format('m[m] s[s]');
    return duration + ' (' + startEnd + ')';
  }

  function getViewableNodes(deployment) {
    var nodes = deployment.Value.Nodes;
    if (nodes) {
      return nodes.map(function (node) {

        var logLink;
        if (node.Status.toLowerCase() === 'success' ||
          (node.Status.toLowerCase() === 'failed' && node.LastCompletedStage.toLowerCase() !== 'timed out')) {
          logLink = '/api/v1/deployments/' + deployment.DeploymentID + '/log?account=' + deployment.AccountName + '&instance=' + node.InstanceId
        }

        return {
          instanceId: node.InstanceId,
          instanceIP: node.InstanceIP,
          status: {
            status: node.Status,
            lastStage: node.LastCompletedStage,
            class: getStatusClass(node.Status),
          },
          duration: getNodeDuration(node),
          numberOfAttempts: node.NumberOfAttempts || 0,
          logLink: logLink,
        };

      });
    }
  }

  function getDeploymentLog(log) {
    if (!log) return '';

    var logLines = log.split(/\r\n|\r|\n/g).filter(function (line) { return !!line; }).reverse();

    var newLogLines = logLines.map(function (line) {
      var r = /^\[(.*?)\]\s(.*)$/g;
      var matches = r.exec(line);
      if (matches) {
        var date = moment(matches[1]).format('HH:mm:ss.SS');
        var message = matches[2];
        return '[' + date + '] ' + message;
      }
    });

    return newLogLines.join('\n');
  }

  function getOverallStatus(deployment) {
    var errorNodes = _.some(deployment.Nodes, function (node) {
      return node.Status.toLowerCase() == 'failed';
    });

    if (errorNodes) return 'Failed';

    return deployment.Status;
  }

  var deployment = deploymentRecord.Value;

  var service = deployment.ServiceName + ' (' + deployment.ServiceVersion + ')';
  var user = deployment.User + ' (' + deployment.OwningCluster + ')';
  var progress = (deployment.Status.toLowerCase() === 'in progress');
  var log = getDeploymentLog(deployment.ExecutionLog);

  var duration = getDuration();
  var error = getError();

  var statusClass = getStatusClass(getOverallStatus(deployment));
  var nodes = getViewableNodes(deploymentRecord);

  var cluster = _.find(clusters, { ClusterName: deployment.OwningCluster });
  var clusterShort = cluster.Value.ShortName.toLowerCase();

  var asgName = deployment.EnvironmentName + '-' + clusterShort + '-' + deployment.ServerRoleName + (deployment.ServiceSlice === 'none' ? '' : '-' + deployment.ServiceSlice);
  // TODO(filip): rather than linking to separate page, open modal inside current page
  var asgLink = '#/environment/servers/?environment=' + deployment.EnvironmentName + '&asg_name=' + asgName;

  return {
    deploymentId: deploymentRecord.DeploymentID,
    environment: deployment.EnvironmentName,
    asgName: asgName,
    asgLink: asgLink,
    status: deployment.Status,
    statusClass: statusClass,
    duration: duration,
    service: service,
    user: user,
    deploymentType: deployment.DeploymentType,
    error: error,
    progress: progress,
    log: log,
    nodes: nodes,
  };
}

angular
  .module('EnvironmentManager.operations')
  .controller('DeploymentDetailsModalController', function ($scope, $uibModalInstance, resources, $timeout, deployment, awsService, Deployment, cachedResources) {
    var id = deployment.DeploymentID;
    var account = deployment.AccountName;
    var refreshTimer;
    var clusters;

    function init() {
      cachedResources.config.clusters.all().then(function (list) {
        clusters = list;
        updateView(deployment);
      });
    }

    function refreshData() {
      spinRefreshIcon();
      var params = { account: account, key: id };
      Deployment.getById(account, id).then(function (deployment) {
        return deployment.fetchNodesIps();
      }).then(updateView);
    }
    
    function updateView(data) {
      $scope.view = deploymentView(data, clusters);

      if (refreshTimer) $timeout.cancel(refreshTimer);

      if (data.Value.Status.toLowerCase() === 'in progress') {
        refreshTimer = $timeout(refreshData, 5000);
      }
    }

    function spinRefreshIcon() {
      $scope.spin = true;
      $timeout(function () { $scope.spin = false; }, 600);
    }

    $scope.Refresh = refreshData;

    $scope.ok = function () {
      $uibModalInstance.dismiss('cancel');
    };

    init();

  });
