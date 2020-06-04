#!/bin/bash

npm run build;
pm2 start ./server/bin/www