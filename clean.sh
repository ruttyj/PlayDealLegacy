#!/bin/bash

# Delete root dependencies
rm -rf node_modules

# Delete client build & dependencies
cd ./client
rm -rf node_modules
rm -rf build

# Delete server dependencies
cd ../server
rm -rf node_modules

# Delete testing dependencies
cd ../tests
rm -rf node_modules