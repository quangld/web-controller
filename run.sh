#!/bin/bash
rm ~/.pm2/logs/*.log
pm2 delete SmartHome
pm2 start app.js --name SmartHome --watch --ignore-watch ".git .gitignore node_modules test public config *.json"
pm2 logs

