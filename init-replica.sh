#!/bin/sh
# Initialize replica set inside the container using localhost as host
docker exec pishro-mongo mongo --eval 'rs.initiate({_id:"rs0", members:[{_id:0, host:"127.0.0.1:27017"}]})'
