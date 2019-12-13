#!/bin/bash
if [ "$1" == "raft" ]; then
  echo "Starting Raft Quorum network"
elif [ "$1" == "istanbul" ]; then
  echo "Starting Istanbul BFT Quorum network"
else
  echo "Specify raft or istanbul for the consensus mechanism"
  exit 1
fi

docker-compose pull
QUORUM_CONSENSUS=$1 docker-compose up -d

until docker logs splunk | grep -m 1 'Ansible playbook complete'
do
  echo 'Waiting for splunk to start'
  sleep 5
done

echo "Restarting Splunk..."
docker exec splunk /bin/bash -c 'sudo mv /opt/splunk/etc/apps/splunk-app-quorum/default/inputs.conf.example /opt/splunk/etc/apps/splunk-app-quorum/default/inputs.conf'
docker exec splunk /bin/bash -c 'sudo mv /opt/splunk/etc/apps/splunk-app-quorum/default/indexes.conf.example /opt/splunk/etc/apps/splunk-app-quorum/default/indexes.conf'
docker exec splunk /bin/bash -c 'sudo /opt/splunk/bin/splunk restart'

echo "Deploying public and private contracts..."
docker exec quorum_node1_1 geth --exec "loadScript('scripts/private-contract.js')" attach qdata/dd/geth.ipc | grep "Address:" | cut -d: -f2 | awk '{$1=$1;print}' > .private-contract
docker exec quorum_node1_1 geth --exec "loadScript('scripts/public-contract.js')" attach qdata/dd/geth.ipc | grep "Address:" | cut -d: -f2 | awk '{$1=$1;print}' > .public-contract

echo "Starting transaction generator in background..."
nohup ./txns.sh &
