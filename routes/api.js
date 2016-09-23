var express = require('express');
var router = express.Router();

var config, controller, fbNotifier, manager;
var env = (require('json-persistent-object'))('./config/enviroment.json');

if (!env.settings) env.settings = 'env.json';

config = new (require('json-persistent-object'))('./config/' + env.settings);
if (!env.controller) env.controller = 'blank.controller.js';
controller = new (require('../modules/' + env.controller))(config.controller);

fbNotifier = new(require('../modules/facebook.notifier.js'))(config.fbAppToken, config.fbManagerID);
manager = new(require('../modules/room-manager.js'))(config.rooms);


console.dir(process.env.COMPUTERNAME);

function isDigikeyValid(req) {
    return ((new Date()).getTime() <= req.session.expires) && (req.session.digikey != null) && (req.body.digikey === req.session.digikey);
}

function getRequestIP(req) {
    let ip = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    return ip.replace(/^.*:/, '');
}

function getSalt() {
    return manager.sha256(Math.random().toString()).substr(5, 16);
}

router.post('/', function(req, res, next) {
    switch (req.body.type) {
        case 'salt':
            req.session.salt = getSalt();
            res.json({
                err: null,
                salt: req.session.salt
            })
            break;
            //case 'session': res.json(req.session); break;
        case 'Up':
        case 'Down':
        case 'Lock':
        case 'Unlock':
            if (isDigikeyValid(req)) {
                remote.click(req.body.type);
                fbNotifier.send(getRequestIP(req) + ' pushed ' + req.body.room);
            } else {
                //notify admin, invalid attempt
                //req.session.expires=0;
                //req.session.digikey=null;
            }
            break;

        case 'login':
            if (!req.session.invalidTries) {
                req.session.invalidTries = 0;
            }
            req.session.digikey = null;
            req.session.admin = false;
            if (req.body.room) {
                
                //console.log(room.id+''+room.pass+req.session.salt,sha256(room.id+''+room.pass+req.session.salt));
                let room = manager.login(req.body.room, req.body.code, req.session.salt);
                if (room) {
                    req.session.digikey = manager.sha256(req.session.salt + req.session.id).substr(12, 64);
                    req.session.expires = new Date().getTime() + config.timeout * 1000;
                    req.session.admin = room.admin || false;
                    req.session.invalidTries = 0
                    fbNotifier.send('Access Granted ' + room.id + ' from ' + getRequestIP(req));
                } else {
                    req.session.invalidTries++;
                    req.session.salt = getSalt();
                    if (req.session.invalidTries > 10) {
                        //notify admin here...
                    }
                }
            }
            res.json({
                digikey: req.session.digikey,
                timeout: config.timeout,
                tries: req.session.invalidTries,
                admin: req.session.admin,
                salt: req.session.salt
            });
            break;

        case 'settings':
            if (isDigikeyValid(req) && req.session.admin) {
                let settings = {};
                settings.fbManagerID = config.fbManagerID;
                settings.timeout = 60;
                req.session.expires = new Date().getTime() + settings.timeout * 1000;
                settings.rooms = config.rooms.map(function(r) {
                    return {
                        id: r.id,
                        name: r.name
                    };
                })
                res.json(settings);
            } else {
                res.json({});
                //notify admin, invalid attempt
                //req.session.expires=0;
                //req.session.digikey=null;
            }
            break;
        case 'update':
            if (isDigikeyValid(req) && req.session.admin) {
                //make sure the user is admin
                //if (!req.session.admin) break;
                res.json(manager.update(req.body.room));
            } else {
                res.json({
                    err: true,
                    message: "you need permission to change"
                });
            }
            break;
        default:
            //unknown api type
            //notify admin
            break;
    }
    //console.log(req.session);
    res.end();
});

module.exports = router;