/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function deploymentView(deploymentRecord, clusters) {
  function getDuration() {
    var startTime = moment(deployment.StartTimestamp);

    if (deployment.Status.toLowerCase() === 'in progress') {
      return {
        label: 'Started',
        value: startTime.fromNow() + ' (' + startTime.format('YYYY-MM-DD HH:mm:ss') + ')'
      };
    }

    var endTime = moment(deployment.EndTimestamp);
    var diff = createDiffString(startTime, endTime);
    
    return {
      label: 'Duration',
      value: diff + ' (' + startTime.format('YYYY-MM-DD, HH:mm:ss') + ' - ' + endTime.format('YYYY-MM-DD, HH:mm:ss') + ')'
    };
  }

  function createDiffString(startTime, endTime) {
    var diff = moment.duration(endTime.diff(startTime));
    var duration = [
      _.pad(diff.get('hours'), 2, 0), 
      _.pad(diff.get('minutes'), 2, 0), 
      _.pad(diff.get('seconds'), 2, 0)].join(':');
    return duration;
  }

  function getError() {
    if (deployment.ErrorReason) {
      return {
        error: deployment.ErrorReason,
        detail: deployment.ErrorDetail
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

    var duration = createDiffString(startTime, endTime);
    return duration + ' (' + startEnd + ')';
  }

  function getViewableNodes(deployment) {
    var nodes = deployment.Value.Nodes;
    if (nodes) {
      return nodes.map(function (node) {
        var logLink = '/api/v1/deployments/' + deployment.DeploymentID + '/log?account=' + deployment.AccountName + '&instance=' + node.InstanceId;

        return {
          instanceId: node.InstanceId,
          instanceIP: node.InstanceIP,
          status: {
            status: node.Status,
            lastStage: node.LastCompletedStage,
            class: getStatusClass(node.Status)
          },
          duration: getNodeDuration(node),
          numberOfAttempts: node.NumberOfAttempts || 0,
          logLink: logLink
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

  var deployment = deploymentRecord.Value;
  var log = getDeploymentLog(deployment.ExecutionLog);

  var duration = getDuration();
  var error = getError();

  var statusClass = getStatusClass(deployment.Status);
  var nodes = getViewableNodes(deploymentRecord);

  var cluster = _.find(clusters, { ClusterName: deployment.OwningCluster });
  var clusterShort = cluster.Value.ShortName.toLowerCase();

  var asgName = deployment.EnvironmentName + '-' + clusterShort + '-' + (deployment.RuntimeServerRoleName || deployment.ServerRoleName);

  var asgLink = '#/environment/servers/?environment=' + deployment.EnvironmentName + '&asg_name=' + asgName;

  return _.assign({ DeploymentID: deploymentRecord.DeploymentID }, deployment, {
    environment: deployment.EnvironmentName,
    asgName: asgName,
    asgLink: asgLink,
    status: deployment.Status,
    statusClass: statusClass,
    duration: duration,
    error: error,
    log: log,
    nodes: nodes
  });
}

angular.module('EnvironmentManager.operations')
  .controller('DeploymentDetailsModalController', function ($scope, $uibModalInstance, resources, $timeout, deployment, awsService, Deployment, modal, cachedResources) {
    var vm = this;

    vm.deployment = deployment;

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
        vm.deployment = deployment;
        return deployment.fetchNodesIps();
      }).then(updateView);
    }

    function updateView(data) {
      vm.view = deploymentView(data, clusters);

      if (refreshTimer) $timeout.cancel(refreshTimer);

      if (data.Value.Status === 'In Progress') {
        refreshTimer = $timeout(refreshData, 5000);
      }
    }

    function spinRefreshIcon() {
      vm.spin = true;
      $timeout(function () { vm.spin = false; }, 600);
    }

    vm.refresh = refreshData;

    vm.ok = function () {
      $uibModalInstance.dismiss('cancel');
    };

    vm.allowCancel = function () {
      return vm.deployment.Value.Status === 'In Progress';
    };

    vm.cancelDeployment = function () {
      modal.confirmation({
        title: 'Cancel Deployment',
        message: 'Are you sure you want to cancel this deployment?<br /><br />' +
          'This will mark the deployment as "Cancelled", and disable any further deployments on new instances. Any installations that are already in progress will be completed.',
        action: 'Yes',
        cancelLabel: 'No',
        severity: 'Danger'
      }).then(function () {
        Deployment.cancelDeployment(id).then(function () {
          // Timeout to give backend time to flush the deployment log
          $timeout(function () { refreshData(); }, 2000);
        });
      });
    };

    init();
  });

