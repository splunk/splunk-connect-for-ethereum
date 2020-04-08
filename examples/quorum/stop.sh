#!/bin/bash

docker-compose --compatibility down
if test -f ".txns.pid"; then
    kill `cat .txns.pid`
    rm .txns.pid
fi
