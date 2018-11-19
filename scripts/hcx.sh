#!/bin/sh
#2018 - z1k-0

LOG=/tmp/hcxdumptool.log
HCXPATH='/pineapple/modules/hcxdumptool/'

HCXMONITOR=''
HCXINTERFACE=`uci get hcx.run.interface`

LOCATION=`uci get hcx.settings.location`
FNAME=`uci get hcx.settings.f_name`
CTIME=`uci get hcx.settings.c_time`
DINTERVAL=`uci get hcx.settings.d_interval`
SCANLIST=`uci get hcx.settings.scanlist`
ESTATUS=`uci get hcx.settings.e_status`

# WHITELIST=${HCXPATH}lists/whitelist.lst
# TMPWHITELIST=${HCXPATH}lists/whitelist.tmp
# BLACKLIST=${HCXPATH}lists/blacklist.lst
# TMPBLACKLIST=${HCXPATH}lists/blacklist.tmp

if [ "$1" = "start" ]; then

	killall -9 hcxdumptool
	# rm ${TMPBLACKLIST}
	# rm ${TMPWHITELIST}
	rm ${LOG}

	echo -e "Starting hcxdumptool..." > ${LOG}

	if [ -z "$HCXINTERFACE" ]; then
		HCXINTERFACE=`iwconfig 2> /dev/null | grep "Mode:Master" | awk '{print $1}' | head -1`
	else
		TMP=`iwconfig 2> /dev/null | awk '{print $1}' | grep ${HCXINTERFACE}`
		if [ -z "$TMP" ]; then
			HCXINTERFACE=`iwconfig 2> /dev/null | grep "Mode:Master" | awk '{print $1}' | head -1`
		fi
	fi

	if [ -z "$HCXMONITOR" ]; then
		HCXMONITOR=`iwconfig 2> /dev/null | grep "Mode:Monitor" | awk '{print $1}' | grep ${HCXINTERFACE}`
		TMP=`iwconfig 2> /dev/null | awk '{print $1}' | grep ${HCXMONITOR}`
		if [ -z "$TMP" ]; then
			HCXMONITOR=`iwconfig 2> /dev/null | grep "Mode:Monitor" | awk '{print $1}' | grep ${HCXINTERFACE}`
		fi
	else
		TMP=`iwconfig 2> /dev/null | awk '{print $1}' | grep ${HCXMONITOR}`
		if [ -z "$TMP" ]; then
			HCXMONITOR=`iwconfig 2> /dev/null | grep "Mode:Monitor" | awk '{print $1}' | grep ${HCXINTERFACE}`
		fi
	fi

	# grep -hv -e ^# ${WHITELIST} -e ^$ > ${TMPWHITELIST}
	# grep -hv -e ^# ${BLACKLIST} -e ^$ > ${TMPBLACKLIST}

	echo -e "Interface : ${HCXINTERFACE}" >> ${LOG}
	echo -e "Monitor : ${HCXMONITOR}" >> ${LOG}

	if [ -n "$LOCATION" ]; then
		echo -e "Location : ${LOCATION}" >> ${LOG}
		LOCATION="-o $LOCATION$FNAME.pcapng"
	else
		echo -e "Location : default" >> ${LOG}
		LOCATION=
	fi

	if [ -n "$CTIME" ]; then
		echo -e "Time on channel : ${CTIME}" >> ${LOG}
		CTIME="-t ${CTIME}"
	else
		echo -e "Time on channel : default" >> ${LOG}
		CTIME=
	fi

	if [ -n "$DINTERVAL" ]; then
		echo -e "Deauth interval : ${DINTERVAL}" >> ${LOG}
		DINTERVAL="-D ${DINTERVAL}"
	else
		echo -e "Deauth interval : default" >> ${LOG}
		DINTERVAL=
	fi

	if [ -n "$SCANLIST" ]; then
		echo -e "Scanlist : ${SCANLIST}" >> ${LOG}
		SCANLIST="-c ${SCANLIST}"
	else
		echo -e "Scanlist : default" >> ${LOG}
		SCANLIST=
	fi

	if [ -n "$ESTATUS" ]; then
		echo -e "Enable status messages : ${ESTATUS}" >> ${LOG}
		ESTATUS="--enable_status ${ESTATUS}"
	else
		echo -e "Enable status messages : default" >> ${LOG}
		ESTATUS=
	fi

	# ifconfig ${HCXINTERFACE} down
	# ifconfig ${HCXINTERFACE} up

	# if [ ${MODE} == "whitelist" ]; then
	#   echo -e "Mode : ${MODE}" >> ${LOG}
	# 	MODE="-w ${TMPWHITELIST}"
	# elif [ ${MODE} == "blacklist" ]; then
	#   echo -e "Mode : ${MODE}" >> ${LOG}
	# 	MODE="-b ${TMPBLACKLIST}"
	# elif [ ${MODE} == "normal" ]; then
	#   echo -e "Mode : ${MODE}" >> ${LOG}
	# 	MODE=""
	# else
	#   echo -e "Mode : default" >> ${LOG}
	# 	MODE=""
	# fi

	uci set hcx.run.interface=${HCXMONITOR}
	uci commit hcx.run.interface

	hcxdumptool $LOCATION -i $HCXMONITOR $SCANLIST $CTIME $DINTERVAL $ESTATUS
	# then convert the PMKID to a hash readable by hashcat
	# hcxpcaptool -z "/root/captured/$FNAME.16800" "/root/captured/$FNAME.pcapng"
	# then run the attack outside the pineapple, example:
	# hashcat -m 16800 "/root/captured/$FNAME.16800" -a 3 -w 3 '?l?l?l?l?l?lt!'

elif [ "$1" = "stop" ]; then
	killall -9 hcxdumptool
	# rm ${TMPBLACKLIST}
	# rm ${TMPWHITELIST}
	rm ${LOG}
fi
