#!/bin/sh
#2018 - z1k-0

[[ -f /tmp/hcx.progress ]] && {
  exit 0
}

touch /tmp/hcx.progress

if [ "$1" = "install" ]; then
  # if [ "$2" = "internal" ]; then
  #   opkg update
  #   opkg install hcxdumptool
  # elif [ "$2" = "sd" ]; then
  #   opkg update
  #   opkg install hcxdumptool --dest sd
  # fi

  touch /etc/config/hcx
  echo "config hcx 'run'" > /etc/config/hcx
  echo "config hcx 'settings'" >> /etc/config/hcx
  echo "config hcx 'module'" >> /etc/config/hcx

  # uci set hcx.settings.mode='normal'
  # uci commit hcx.settings.mode

  ## Default values
  uci set hcx.settings.location='/root/captured/'
  uci commit hcx.settings.location
	uci set hcx.settings.f_name='test'
  uci commit hcx.settings.f_name
	uci set hcx.settings.c_time=5
  uci commit hcx.settings.c_time
	uci set hcx.settings.d_interval=10
  uci commit hcx.settings.d_interval
	uci set hcx.settings.scanlist='1, 3, 5, 7, 9, 11, 13, 2, 4, 6, 8, 10, 12'
  uci commit hcx.settings.scanlist
	uci set hcx.settings.e_status=3
	uci commit hcx.settings.e_status

  uci set hcx.module.installed=1
  uci commit hcx.module.installed

elif [ "$1" = "remove" ]; then
    # opkg remove hcxdumptool
    rm -rf /etc/config/hcx
fi

rm /tmp/hcx.progress
