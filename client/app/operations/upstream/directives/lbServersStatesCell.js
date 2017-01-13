/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.operations').component('lbServersStatesCell', {
  templateUrl: '/app/operations/upstream/directives/lbServersStatesCell.html',
  bindings: {
    data: '<'
  },
  replace: true,
  controller: function ($sce, $templateRequest, $compile, comparisons, $log) {
    var $ctrl = this;

    if (!this.data) {
      $log.warn('No data passed to lbServersStatesCell!');
      return;
    }

    var html = '<table class="table service-hover-table">';

    var lbs = this.data.LBs.sort(function (a, b) { return a.Name > b.Name; });

    html += '<tr>';
    _.forEach(lbs, function (lb) { html += '<th>' + lb.Name + '</th>'; });
    html += '</tr>';

    html += '<tr>';
    _.forEach(lbs, function (lb) {
      html += '<td>';

      if (lb.State.Overall === 'Up') { html += '<span class="status-up"><span class="glyphicon glyphicon-triangle-top"></span> Up (' + lb.State.UpCount + ')</span>'; }

      if (lb.State.Overall === 'Down') {
        html += '<span class="status-down"><span class="glyphicon glyphicon-triangle-bottom"></span> Down (' + lb.State.DownCount + ')</span>';
      }

      if (lb.State.Overall === 'Unhealthy') { html += '<span class="status-error" title="All servers unhealthy"><span class="glyphicon glyphicon-exclamation-sign"></span> Unhealthy (' + lb.State.UnhealthyCount + ')</span>'; }

      if (lb.State.Overall === 'UpUnhealthy') {
        html += '<span class="status-up"><span class="glyphicon glyphicon-triangle-top"></span> Up (' + lb.State.UpCount + ') </span>' +
        '<span class="status-down"><span class="glyphicon glyphicon-exclamation-sign"></span> Unhealthy (' + lb.State.UnhealthyCount + ')</span>';
      }

      if (lb.State.Overall === 'Empty') {
        html += '<span class="status-warning" title="No servers found"><span class="glyphicon glyphicon-exclamation-sign"></span> Empty</span>';
      }

      if (lb.State.Overall === 'ConfigError') { html += '<span class="status-error" title="Upstream has both Up and Down servers"><span class="glyphicon glyphicon-exclamation-sign"></span> Config Error</span>'; }

      html += '</td>';
    });
    html += '</tr>';

    html += '</table>';

    this.popoverHtml = $sce.trustAsHtml(html);
  }
});
