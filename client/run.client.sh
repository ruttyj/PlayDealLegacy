#!/bin/bash
nodemon ./node_modules/webpack-dev-server/bin/webpack-dev-server.js --mode development --config webpack.prod.config.js --port 3000 --env.NODE_ENV=prodLocal