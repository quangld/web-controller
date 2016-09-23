rem this requires PM2 to run http://pm2.keymetrics.io/
pm2 start app.js --name SmartHome --watch --ignore-watch ".git node_modules test public config *.json"
start pm2 logs