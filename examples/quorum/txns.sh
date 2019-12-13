#!/bin/bash
ADDRESS=`cat .public-contract`
sed "s|var address = '.*';|var address = '${ADDRESS}';|" scripts/public-generate-events.js > scripts/public-generate-events.tmp
mv scripts/public-generate-events.tmp scripts/public-generate-events.js

ADDRESS=`cat .private-contract`
sed "s|var address = '.*';|var address = '${ADDRESS}';|" scripts/private-generate-events.js > scripts/private-generate-events.tmp
mv scripts/private-generate-events.tmp scripts/private-generate-events.js

echo "Press [CTRL+C] to stop.."
while :
do
  NODE=$(((RANDOM % 2) + 1))
  echo "Connecting to random node: $NODE"
  docker exec quorum_node${NODE}_1 geth --exec "loadScript('scripts/public-generate-events.js')" attach qdata/dd/geth.ipc
  docker exec quorum_node${NODE}_1 geth --exec "loadScript('scripts/private-generate-events.js')" attach qdata/dd/geth.ipc

  echo "Sleeping 30 secs"
  sleep 30
done
