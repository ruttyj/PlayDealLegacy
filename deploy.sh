#!/bin/bash
cd client 
cp sample.prod.env .env
cd ../
pm2 run ./server/bin/dev_www
cd client 
npm run dev