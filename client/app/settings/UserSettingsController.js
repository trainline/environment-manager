(function () {
    'use strict';

    angular
        .module('EnvironmentManager.settings')
        .controller('UserSettingsController', UserSettingsController);

    UserSettingsController.$inject = ['$uibModal', '$uibModalInstance', 'localstorageservice'];

    function UserSettingsController($uibModal, $uibModalInstance, localstorageservice) {
        var vm = this;

        vm.title = 'User Settings';
        vm.loadSettings = loadSettings;
        vm.save = save;
        vm.closeAndSave = closeAndSave;
        vm.close = close;

        vm.settings = {};

        loadSettings();

        function save() {
            _saveEnvironments();
        }

        function closeAndSave() {
            save();
            $uibModalInstance.close();
        }

        function close() {
            $uibModalInstance.close();
        }

        function loadSettings() {
            vm.settings.environments = localstorageservice.get('em-settings-environments');
        }

        function _saveEnvironments() {
            var providedEnvironments = vm.settings.environments;
            var listOfEnvironments = providedEnvironments.split(',').map(function (e) {
                return e.trim();
            });
            var environmentsReadyToSave = listOfEnvironments.join(',');
            vm.settings.environments = environmentsReadyToSave;
            localstorageservice.set('em-settings-environments', environmentsReadyToSave);
        }
    }
}());
