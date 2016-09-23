#!/bin/bash
#this requires PM2 to run http://pm2.keymetrics.io/

pm2 restart app.js --name SmartHome --watch --ignore-watch ".git .gitignore node_modules test public *.json"
pm2 logs

