#!/bin/bash

cd client
./pm2.start.sh

cd ../server
./pm2.start.sh