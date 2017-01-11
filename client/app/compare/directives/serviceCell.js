/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.compare').component('serviceCell', {
  templateUrl: '/app/compare/directives/serviceCell.html',
  bindings: {
    data: '<'
  },
  replace: true,
  controller: function ($sce, $templateRequest, $compile, comparisons, $log) {
    var $ctrl = this;

    if (!this.data) {
      $log.warn('No data passed to serviceCell!')
      return;
    }
    
    var html = '<table class="table service-hover-table">';
    html += '<tr><th>Server role</th><th>Version</th></tr>'
    _.forEach(this.data.serverRoles, function (deployments, serverRoleName) {
      deployments = deployments.sort(function (a, b) {
        return comparisons.semver(a.version, b.version);
      });
      _.forEach(deployments, function (deployment) {
        html += '<tr>';
        html += '<td>' + serverRoleName + '</td>';
        html += '<td>' + deployment.version;
        if (deployment.slice !== 'none') {
          html += ' (<span class="slice-symbol ' + deployment.slice + '"></span>' + deployment.slice + ' )';
        }
        html += '</td>';
        html += '</tr>';
      });
    });
    html += '</table>'
    
    this.popoverHtml = $sce.trustAsHtml(html);
  }
});
