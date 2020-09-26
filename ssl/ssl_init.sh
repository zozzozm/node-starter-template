#!/bin/bash
# check to see where the script is being run from and set local variables
if [ ! -f ../.env ]; then
   echo -e "\e[31mERROR: \e[0mcould not found .env file in $(cd ../ && pwd) directory"
   exit 1;
fi
source ../.env
docker run -it --rm  -v ${CERTS_DIR}:/etc/letsencrypt  -v ${CERTS_DATA_DIR}:/data/letsencrypt  certbot/certbot  certonly  --webroot --webroot-path=/data/letsencrypt  -d ${FQDN_OR_IP} -d www.${FQDN_OR_IP}