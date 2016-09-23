pm2 start app.js --name SmartHome --watch --ignore-watch ".git node_modules test public config *.json"
pm2 logs