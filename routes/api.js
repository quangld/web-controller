var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var rpio = require('rpio');

var config = {
	gpioPins: {Up:11,Stop:13,Down:15},
	gpioPinTimeout: 100, //milliseconds
    timeout: 300, //seconds
    rooms: [{
        id: 100,
        pass: '1419',
        name: 'Trang'
    }, {
        id: 101,
        pass: '0222',
        name: 'Quang Le'
    }, {
        id: 201,
        pass: '1234',
        name: 'Japan'
    }]
}

//initialize gpio pins
for (let p in config.gpioPins) rpio.open(config.gpioPins[p], rpio.OUTPUT);

function sha256(str) {
    return crypto.createHash('sha256').update(str).digest('hex');
}

function isDigikeyValid(req) {
	return (((new Date()).getTime()-req.session.expires)<=config.timeout*1000) && (req.session.digikey!=null) && (req.body.digikey===req.session.digikey);
}

function pushButton(button) {
	if (button in config.gpioPins) {
		console.log('Pushed',button,config.gpioPins[button]);
		let pin = config.gpioPins[button];
        rpio.write(pin, rpio.HIGH);
        setTimeout(function() {
                rpio.write(pin, rpio.LOW);
        }, config.gpioPinTimeout);;
	}
}

router.post('/', function(req, res, next) {
    switch (req.body.room) {
        case 'salt':
            req.session.salt = sha256(Math.random().toString()).substr(5, 16);
            res.json({
                err: null,
                salt: req.session.salt
            })
            break;
        case 'session':
            res.json(req.session);
            break;
        case 'Up':
        case 'Down':
        case 'Stop':
        	if (isDigikeyValid(req)) {
        		pushButton(req.body.room);
        	} else {
        		//notify admin, invalid attempt
        		//req.session.expires=0;
        		//req.session.digikey=null;
        	}
        	break;
        default:
            if (!req.session.invalidTries)
                req.session.invalidTries = 0;
            let room = config.rooms.find(function(e) {
                return e.id == req.body.room;
            });
            req.session.digikey = null;
            if (room) {
                //console.log(room.id+''+room.pass+req.session.salt,sha256(room.id+''+room.pass+req.session.salt));
                if (req.body.code == sha256(room.id + '' + room.pass + req.session.salt)) {
                    req.session.digikey = sha256(req.session.salt + req.session.id).substr(12, 64);
                    req.session.expires = new Date().getTime();
                    req.session.invalidTries = 0
                } else {
                    req.session.invalidTries++;
                    if (req.session.invalidTries > 10) {
                        //notify authority here...
                    }
                }
            }
            res.json({
                digikey: req.session.digikey,
                timeout: config.timeout,
                tries: req.session.invalidTries
            });
            break;
    }
    //console.log(req.session);
    res.end();
});

module.exports = router;