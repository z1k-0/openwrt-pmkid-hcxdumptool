<?php namespace pineapple;

class hcxdumptool extends Module
{
    public function route()
    {
        switch ($this->request->action) {
            case 'refreshInfo':
                $this->refreshInfo();
                break;
            case 'refreshOutput':
                $this->refreshOutput();
                break;
            case 'refreshStatus':
                $this->refreshStatus();
                break;
            case 'togglehcx':
                $this->togglehcx();
                break;
            case 'handleDependencies':
                $this->handleDependencies();
                break;
            case 'handleDependenciesStatus':
                $this->handleDependenciesStatus();
                break;
            case 'getInterfaces':
                $this->getInterfaces();
                break;
            case 'scanForNetworks':
                $this->scanForNetworks();
                break;
            case 'getSettings':
                $this->getSettings();
                break;
            case 'setSettings':
                $this->setSettings();
                break;
            case 'getListsData':
                $this->getListsData();
                break;
            case 'saveListsData':
                $this->saveListsData();
                break;
        }
    }

    protected function checkDependency($dependencyName)
    {
        return ((exec("which {$dependencyName}") == '' ? false : true) && ($this->uciGet("hcx.module.installed")));
    }

    protected function getDevice()
    {
        return trim(exec("cat /proc/cpuinfo | grep machine | awk -F: '{print $2}'"));
    }

    protected function refreshInfo()
    {
        $moduleInfo = @json_decode(file_get_contents("/pineapple/modules/hcxdumptool/module.info"));
        $this->response = array('title' => $moduleInfo->title, 'version' => $moduleInfo->version);
    }

    private function handleDependencies()
    {
        if (!$this->checkDependency("hcxdumptool")) {
            $this->execBackground("/pineapple/modules/hcxdumptool/scripts/dependencies.sh install ".$this->request->destination);
            $this->response = array('success' => true);
        } else {
            $this->execBackground("/pineapple/modules/hcxdumptool/scripts/dependencies.sh remove");
            $this->response = array('success' => true);
        }
    }

    private function handleDependenciesStatus()
    {
        if (!file_exists('/tmp/hcx.progress')) {
            $this->response = array('success' => true);
        } else {
            $this->response = array('success' => false);
        }
    }

    private function togglehcx()
    {
        if (!$this->checkRunning("hcxdumptool")) {
            $this->uciSet("hcx.run.interface", $this->request->interface);

            $this->execBackground("/pineapple/modules/hcxdumptool/scripts/hcx.sh start");
        } else {
            $this->uciSet("hcx.run.interface", '');

            $this->execBackground("/pineapple/modules/hcxdumptool/scripts/hcx.sh stop");
        }
    }

    private function refreshStatus()
    {
        if (!file_exists('/tmp/hcx.progress')) {
            if (!$this->checkDependency("hcxdumptool")) {
                $installed = false;
                $install = "Not installed";
                $installLabel = "danger";
                $processing = false;
                $status = "Start";
                $statusLabel = "success";
            } else {
                $installed = true;
                $install = "Installed";
                $installLabel = "success";
                $processing = false;

                if ($this->checkRunning("hcxdumptool")) {
                    $status = "Stop";
                    $statusLabel = "danger";
                } else {
                    $status = "Start";
                    $statusLabel = "success";
                }
            }
        } else {
            $installed = false;
            $install = "Installing...";
            $installLabel = "warning";
            $processing = true;
            $status = "Start";
            $statusLabel = "success";
        }

        $device = $this->getDevice();
        $this->response = array("device" => $device, "status" => $status, "statusLabel" => $statusLabel, "installed" => $installed, "install" => $install, "installLabel" => $installLabel, "processing" => $processing);
    }

    private function refreshOutput()
    {
        if ($this->checkDependency("hcxdumptool")) {
            if ($this->checkRunning("hcxdumptool")) {
                exec("cat /tmp/hcxdumptool.log", $output);
                if (!empty($output)) {
                    $this->response = implode("\n", array_reverse($output));
                } else {
                    $this->response = "Empty log...";
                }
            } else {
                $this->response = "hcxdumptool is not running...";
            }
        } else {
            $this->response = "hcxdumptool is not installed...";
        }
    }

    private function getInterfaces()
    {
        exec("iwconfig 2> /dev/null | grep \"wlan*\" | awk '{print $1}'", $interfaceArray);

        $this->response = array("interfaces" => $interfaceArray, "selected" => $this->uciGet("hcx.run.interface"));
    }

    private function scanForNetworks()
    {
        $interface = escapeshellarg($this->request->interface);
        if (substr($interface, -4, -1) === "mon") {
            if ($interface == "'wlan1mon'") {
                exec("killall pineap");
                exec("killall pinejector");
            }
            exec("airmon-ng stop {$interface}");
            $interface = substr($interface, 0, -4) . "'";
            exec("iw dev {$interface} scan &> /dev/null");
        }
        exec("iwinfo {$interface} scan", $apScan);

        $apArray = preg_split("/^Cell/m", implode("\n", $apScan));
        $returnArray = array();
        foreach ($apArray as $apData) {
            $apData = explode("\n", $apData);
            $accessPoint = array();
            $accessPoint['mac'] = substr($apData[0], -17);
            $accessPoint['ssid'] = substr(trim($apData[1]), 8, -1);
            if (mb_detect_encoding($accessPoint['ssid'], "auto") === false) {
                continue;
            }

            $accessPoint['channel'] = intval(substr(trim($apData[2]), -2));

            $signalString = explode("  ", trim($apData[3]));
            $accessPoint['signal'] = substr($signalString[0], 8);
            $accessPoint['quality'] = substr($signalString[1], 9);

            $security = substr(trim($apData[4]), 12);
            if ($security === "none") {
                $accessPoint['security'] = "Open";
            } else {
                $accessPoint['security'] = $security;
            }

            if ($accessPoint['mac'] && trim($apData[1]) !== "ESSID: unknown") {
                array_push($returnArray, $accessPoint);
            }
        }
        $this->response = $returnArray;
    }

    private function getSettings()
    {
        $settings = array(
          'location' => $this->uciGet("hcx.settings.location"),
          'f_name' => $this->uciGet("hcx.settings.f_name"),
          'c_time' => $this->uciGet("hcx.settings.c_time"),
          'd_interval' => $this->uciGet("hcx.settings.d_interval"),
          'scanlist' => $this->uciGet("hcx.settings.scanlist"),
          'e_status' => $this->uciGet("hcx.settings.e_status")
        );
        $this->response = array('settings' => $settings);
    }

    private function setSettings()
    {
        $settings = $this->request->settings;
        $this->uciSet("hcx.settings.location", $settings->location);
        $this->uciSet("hcx.settings.f_name", $settings->f_name);
        $this->uciSet("hcx.settings.c_time", $settings->c_time);
        $this->uciSet("hcx.settings.d_interval", $settings->d_interval);
        $this->uciSet("hcx.settings.scanlist", $settings->scanlist);
        $this->uciSet("hcx.settings.e_status", $settings->e_status);
    }

    private function getListsData()
    {
        $blacklistData = file_get_contents('/pineapple/modules/hcxdumptool/lists/blacklist.lst');
        $whitelistData = file_get_contents('/pineapple/modules/hcxdumptool/lists/whitelist.lst');
        $this->response = array("blacklistData" => $blacklistData, "whitelistData" => $whitelistData );
    }

    private function saveListsData()
    {
        $filename = '/pineapple/modules/hcxdumptool/lists/blacklist.lst';
        file_put_contents($filename, $this->request->blacklistData);

        $filename = '/pineapple/modules/hcxdumptool/lists/whitelist.lst';
        file_put_contents($filename, $this->request->whitelistData);
    }
}
