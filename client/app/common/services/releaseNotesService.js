/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

(function () {
  angular
    .module('EnvironmentManager.common')
    .factory('releasenotesservice', releasenotesservice);

  releasenotesservice.$inject = ['localstorageservice'];

  function releasenotesservice(localstorageservice) {
    return {
      show: show
    };

    /**
     * Show the release notes link if the user has not seen it before
     * @param {String} version example: "1.1.1"
     */
    function show(version) {
      if (localstorageservice.exists(version)) {
        return null;
      }

      var steps = [{
        content: ['<p>There has been a new release of Environment Manager ',
          '<span class="badge badge-success">' + version + '</span></p>',
          '<p><a target="_blank" href="https://github.com/trainline/environment-manager/blob/master/CHANGELOG.md">',
          'Take me to the release notes</a></p>'
        ].join('\n'),
        nextButton: true,
        // eslint-disable-next-line no-undef
        target: $('#logo'),
        my: 'top left',
        at: 'bottom right'
      }];

      // eslint-disable-next-line no-undef
      var tour = new Tourist.Tour({
        steps: steps,
        closeButton: true,
        tipClass: 'Bootstrap',
        tipOptions: { showEffect: 'slidein' }
      });
      tour.start();

      localstorageservice.set(version, 'true');

      return null;
    }
  }
}());
