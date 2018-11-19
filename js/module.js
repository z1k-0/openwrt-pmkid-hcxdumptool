registerController('hcxCtrl', ['$api', '$scope', '$rootScope', '$interval', '$timeout', function($api, $scope, $rootScope, $interval, $timeout) {
	$scope.title = "Loading...";
	$scope.version = "Loading...";
	$scope.refreshInfo = (function() {
		$api.request({
			module: "hcxdumptool",
			action: "refreshInfo"
		}, function(response) {
			$scope.title = response.title;
			$scope.version = "v" + response.version;
		})
	});
	$scope.refreshInfo();
}]);


registerController('hcxControlsController', ['$api', '$scope', '$rootScope', '$interval', '$timeout', function($api, $scope, $rootScope, $interval, $timeout) {
  $scope.status = "Loading...";
  $scope.statusLabel = "default";
  $scope.starting = false;

  $scope.install = "Loading...";
  $scope.installLabel = "success";
  $scope.processing = false;

  $scope.interfaces = [];
  $scope.selectedInterface = "--";

  $scope.saveSettingsLabel = "default";

  $scope.device = '';

  $rootScope.status = {
    installed: false,
    refreshOutput: false
  };

  $scope.refreshStatus = (function() {
    $api.request({
      module: "hcxdumptool",
      action: "refreshStatus"
    }, function(response) {
      $scope.status = response.status;
      $scope.statusLabel = response.statusLabel;

      $rootScope.status.installed = response.installed;
      $scope.device = response.device;
      if (response.processing) $scope.processing = true;
      $scope.install = response.install;
      $scope.installLabel = response.installLabel;
    })
  });

  $scope.togglehcx = (function() {
    if ($scope.status != "Stop")
      $scope.status = "Starting...";
    else
      $scope.status = "Stopping...";

    $scope.statusLabel = "warning";
    $scope.starting = true;

    $rootScope.status.refreshOutput = false;

    $api.request({
      module: "hcxdumptool",
      action: 'togglehcx',
      interface: $scope.selectedInterface
    }, function(response) {
      $timeout(function() {
        $rootScope.status.refreshOutput = true;
        $scope.starting = false;
        $scope.refreshStatus();
        $scope.getInterfaces();
      }, 3000);
    })
  });

  $scope.handleDependencies = (function(param) {
    if (!$rootScope.status.installed)
      $scope.install = "Installing...";
    else
      $scope.install = "Removing...";

    $api.request({
      module: "hcxdumptool",
      action: 'handleDependencies',
      destination: param
    }, function(response) {
      if (response.success === true) {
        $scope.installLabel = "warning";
        $scope.processing = true;
        $scope.handleDependenciesInterval = $interval(function() {
          $api.request({
            module: "hcxdumptool",
            action: 'handleDependenciesStatus'
          }, function(response) {
            if (response.success === true) {
              $scope.processing = false;
              $interval.cancel($scope.handleDependenciesInterval);
              $scope.refreshStatus();
            }
          });
        }, 5000);
      }
    });
  });

  $scope.getInterfaces = (function() {
    $api.request({
      module: "hcxdumptool",
      action: 'getInterfaces'
    }, function(response) {
      $scope.interfaces = response.interfaces;
      if (response.selected != "")
        $scope.selectedInterface = response.selected;
      else
        $scope.selectedInterface = $scope.interfaces[0];
    });
  });

  $scope.refreshStatus();
  $scope.getInterfaces();
}]);


registerController('hcxOutputController', ['$api', '$scope', '$rootScope', '$interval', function($api, $scope, $rootScope, $interval) {
	$scope.output = 'Loading...';
	$scope.filter = '';

	$scope.refreshLabelON = "default";
	$scope.refreshLabelOFF = "danger";

	$scope.refreshOutput = (function() {
		$api.request({
			module: 'hcxdumptool',
			action: "refreshOutput"
		}, function(response) {
			$scope.output = response;
		})
	});

	$scope.toggleAutoRefresh = (function() {
		if ($scope.autoRefreshInterval) {
			$interval.cancel($scope.autoRefreshInterval);
			$scope.autoRefreshInterval = null;
			$scope.refreshLabelON = "default";
			$scope.refreshLabelOFF = "danger";
		} else {
			$scope.refreshLabelON = "success";
			$scope.refreshLabelOFF = "default";

			$scope.autoRefreshInterval = $interval(function() {
				$scope.refreshOutput();
			}, 5000);
		}
	});

	$scope.refreshOutput();

	$rootScope.$watch('status.refreshOutput', function(param) {
		if (param) {
			$scope.refreshOutput();
		}
	});
}]);

registerController('hcxEditorController', ['$api', '$scope', '$rootScope', '$timeout', function($api, $scope, $rootScope, $timeout) {
	$scope.accessPoints = [];
	$scope.selectedAP = {};
	$scope.scanLabel = "default";
	$scope.scan = "Scan";
	$scope.scanning = false;
	$scope.saveListsLabel = "primary";
	$scope.saveLists = "Save";
	$scope.saving = false;
	$scope.blacklistData = '';
	$scope.whitelistData = '';
	$scope.clearWhitelist = (function() { $scope.whitelistData = ''; });
	$scope.clearBlacklist = (function() { $scope.blacklistData = ''; });

	$scope.getListsData = (function() {
		$api.request({
			module: "hcxdumptool",
			action: 'getListsData'
		}, function(response) {
			$scope.blacklistData = response.blacklistData;
			$scope.whitelistData = response.whitelistData;
		});
	});

	$scope.saveListsData = (function() {
		$scope.saveListsLabel = "warning";
		$scope.saveLists = "Saving...";
		$scope.saving = true;

		$api.request({
			module: "hcxdumptool",
			action: 'saveListsData',
			blacklistData: $scope.blacklistData,
			whitelistData: $scope.whitelistData
		}, function(response) {
			$scope.saveListsLabel = "success";
			$scope.saveLists = "Saved";

			$timeout(function() {
				$scope.saveListsLabel = "primary";
				$scope.saveLists = "Save";
				$scope.saving = false;
			}, 2000);
		});
	});

	$scope.addWhitelist = (function() {
		if ($scope.whitelistData != "")
			$scope.whitelistData = $scope.whitelistData + '\n' + '# ' + $scope.selectedAP.ssid + '\n' + $scope.selectedAP.mac;
		else
			$scope.whitelistData = '# ' + $scope.selectedAP.ssid + '\n' + $scope.selectedAP.mac;
	});

	$scope.addBlacklist = (function() {
		if ($scope.blacklistData != "")
			$scope.blacklistData = $scope.blacklistData + '\n' + '# ' + $scope.selectedAP.ssid + '\n' + $scope.selectedAP.mac;
		else
			$scope.blacklistData = '# ' + $scope.selectedAP.ssid + '\n' + $scope.selectedAP.mac;
	});

	$scope.scanForNetworks = (function() {
		$scope.scanLabel = "warning";
		$scope.scan = "Scanning...";
		$scope.scanning = true;

		$api.request({
			module: "hcxdumptool",
			action: 'scanForNetworks',
			interface: $scope.selectedInterface
		}, function(response) {
			$scope.scanLabel = "success";
			$scope.scan = "Done";

			$timeout(function() {
				$scope.scanLabel = "default";
				$scope.scan = "Scan";
				$scope.scanning = false;
			}, 2000);

			$scope.accessPoints = response;
			$scope.selectedAP = $scope.accessPoints[0];
		});
	});

	$scope.getInterfaces = (function() {
		$api.request({
			module: "hcxdumptool",
			action: 'getInterfaces'
		}, function(response) {
			$scope.interfaces = response.interfaces;
			if (response.selected != "")
				$scope.selectedInterface = response.selected;
			else
				$scope.selectedInterface = $scope.interfaces[0];
		});
	});

	$scope.getInterfaces();
	$scope.getListsData();
}]);

registerController('hcxSettingsController', ['$api', '$scope', '$rootScope', '$timeout', function($api, $scope, $rootScope, $timeout) {
	$scope.settings = {
		location: '',
		f_name: '',
		c_time: '',
    d_interval: '',
    scanlist: '',
    e_status: ''
	};

	$scope.saveSettingsLabel = "primary";
	$scope.saveSettings = "Save";
	$scope.saving = false;

	$scope.getSettings = function() {
		$api.request({
			module: "hcxdumptool",
			action: 'getSettings'
		}, function(response) {
			$scope.settings = response.settings;
      $rootScope.cmdThatRuns = `hcxdumptool -o "${response.settings.location}${response.settings.f_name}.pcapng" -i ... -c ${response.settings.scanlist} -t ${response.settings.c_time} -D ${response.settings.d_interval} --enable_status ${response.settings.e_status}`;
		});
	};

	$scope.setSettings = function() {
		$scope.saveSettingsLabel = "warning";
		$scope.saveSettings = "Saving...";
		$scope.saving = true;

		$api.request({
			module: "hcxdumptool",
			action: 'setSettings',
			settings: $scope.settings
		}, function(response) {
			$scope.getSettings();

			$scope.saveSettingsLabel = "success";
			$scope.saveSettings = "Saved";

			$timeout(function() {
				$scope.saveSettingsLabel = "primary";
				$scope.saveSettings = "Save";
				$scope.saving = false;
			}, 2000);
		});
	};

	$scope.getSettings();
}]);
