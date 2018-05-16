/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
angular.module('EnvironmentManager.configuration').controller('PickAmiController',
  function ($scope, $uibModalInstance, awsService, currentAmi, context) {
    var vm = this;
    vm.context = context;
    vm.links = _.pick(window.links, ['LIST_OF_IMAGES', 'LINUX_PUPPET_REPO']);

    $scope.ImagesByType = [];
    $scope.SelectedImageType = null;
    $scope.Version = {
      UseLatest: true,
      SelectedVersion: null
    };

    $scope.DataLoading = true;
    $scope.InitialVersionSet = false;

    function init() {
      awsService.images.GetImageDetails().then(function (amiData) {
        var images = awsService.images.RestructureImagesByType(amiData);

        $scope.ImagesByType = images.map(function sortVersions(image) {
          image.Versions = awsService.images.SortByVersion(image.Versions);
          image.Versions.map(function addDisplayName(version) {
            version.DisplayName = version.AmiVersion;
            if (version.IsStable) version.DisplayName += ' [Stable]';
          });

          return image;
        }).sort(function (a, b) { return a.Name.localeCompare(b.Name); });

        // Process current selection if set
        if (currentAmi) {
          var amiType = awsService.images.GetAmiTypeFromName(currentAmi);
          var amiVersion = awsService.images.GetAmiVersionFromName(currentAmi);
          $scope.SelectedImageType = GetAmiByName(amiType, images);
          $scope.Version.UseLatest = !amiVersion;
        } else {
          $scope.Version.UseLatest = false;
        }

        if ($scope.SelectedImageType == null) {
          $scope.SelectedImageType = $scope.ImagesByType[0];
        }

        $scope.DataLoading = false;
      });
    }

    $scope.Ok = function () {
      var selectedAmiName = $scope.SelectedImageType.Name;
      var selectedVersion = $scope.Version.SelectedVersion.AmiVersion;
      var selectedImage = $scope.SelectedImageType.LatestVersion;
      var versionSuffix = '';

      if (!$scope.Version.UseLatest) {
        versionSuffix = '-' + $scope.Version.SelectedVersion.AmiVersion;
        selectedImage = _.find($scope.SelectedImageType.Versions, function (i) {
          return i.AmiVersion === selectedVersion;
        });
      }

      var selectedImageInfo = {
        displayName: selectedAmiName + versionSuffix,
        rootVolumeSize: selectedImage.RootVolumeSize,
        platform: $scope.SelectedImageType.LatestVersion.Platform
      };

      $uibModalInstance.close(selectedImageInfo);
    };

    $scope.Cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    // Update versions list on Image type selection
    $scope.$watch('SelectedImageType', function (newValue, oldValue) {
      if (!$scope.DataLoading && !$scope.InitialVersionSet) {
        var amiVersion = awsService.images.GetAmiVersionFromName(currentAmi);
        var initialAmiVersion = GetAmiByVersion(amiVersion, $scope.SelectedImageType.Versions);
        initialAmiVersion = initialAmiVersion ||
          firstStable($scope.SelectedImageType.Versions) ||
          $scope.SelectedImageType.Versions[0];
        $scope.Version.SelectedVersion = initialAmiVersion;
        $scope.InitialVersionSet = true;
      } else if ($scope.SelectedImageType && $scope.SelectedImageType.Versions) {
        $scope.Version.SelectedVersion = firstStable($scope.SelectedImageType.Versions) || $scope.SelectedImageType.Versions[0];
      }
    });

    function firstStable(versions) {
      return _.find(versions, function (version) {
        return version.IsStable === true;
      });
    }

    function GetAmiByName(amiName, images) {
      for (var i = 0; i < images.length; i++) {
        if (images[i].Name == amiName) {
          return images[i];
        }
      }

      return null;
    }

    function GetAmiByVersion(amiVersion, images) {
      for (var i = 0; i < images.length; i++) {
        if (images[i].AmiVersion == amiVersion) {
          return images[i];
        }
      }

      return null;
    }

    init();
  });

