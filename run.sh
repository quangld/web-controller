#!/bin/bash
pm2 restart app.js --name SmartHome --watch --ignore-watch ".git node_modules test public *.json"
pm2 logs

