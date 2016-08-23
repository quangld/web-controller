var Controller = function() {
    var _this = this;
    this.code = '';
    this.salt = '';
    this.lblStatus = $('#status');
    $('.btn').click(function(e) {
        _this.btnHandler(e);
    });
}

Controller.prototype.setStatus = function(str) {
    this.lblStatus.text(str?str:'Enter Your Passcode');
}

Controller.prototype.input = function(code) {
    if (!this.code)
        this.getSalt();
    if (code) {
        this.code += code;
        this.setStatus('(' + this.code.length + ') ' + '************************'.substr(0, this.code.length));
    }
    ((this.code.length<7) || (!this.salt)) ? $('#bEnter').hide() : $('#bEnter').show();
    (this.code.length<=0) ? $('#bClear').hide() : $('#bClear').show();

}

Controller.prototype.btnHandler = function(e) {
    var id = e.target.id;
    if (id.charAt(0) != 'b') return;
    id = id.substr(1);
    console.log(id);
    switch (id) {
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
            this.input(id);
            break;
        case 'Clear':
            this.clearPasscode();
            break;
        case 'Enter':
            this.submitPasscode();
            break;
        case 'Up':
        case 'Down':
        case 'Stop':
            this.send({digikey: this.digikey,room:id}, function(data) {
                //
            })
            break;
    }
}


Controller.prototype.getSalt = function() {
    var _this = this;
    this.send({room:'salt'}, function(data) {
        if (!data.err && data.salt) {
            //console.log('Salt received',data.salt);
            _this.salt = data.salt;
        }
    });
}

Controller.prototype.clearPasscode = function() {
    this.code = '';
    this.lblStatus.text('Enter Your Passcode');
    $('#bEnter').hide();
    $('#bClear').hide();
}

Controller.prototype.reset = function() {
    this.digikey=null;
    $('#keypad').show();
    $('#controller').hide();
    this.clearPasscode();
}
Controller.prototype.countDown = function() {
    $('#timer').text('Automatically log out in '+(this.timer--)+' seconds');
    if (this.timer<=0) {
        this.reset();
    } else {
        var _this=this;
        setTimeout(function() { _this.countDown(); }, 1000);
    }
}

Controller.prototype.submitPasscode = function() {
    var _this=this;
    //console.log(this.code+''+this.salt,sha256(this.code+''+this.salt));
    this.send({room:this.code.substr(0,3), code: sha256(this.code+this.salt)}, function(data) {
        if (data.digikey) {
            _this.digikey=data.digikey;
            _this.setStatus('Access Granted!');
            $('#keypad').hide();
            $('#controller').show();
            _this.timer=data.timeout;
            setTimeout(function() { _this.countDown(); }, 1000);

        } else {
            _this.setStatus('Invalid Passcode!'+((data.tries>1)?' ('+data.tries+' times)':''));
        }
    });
    this.code = '';
    this.setStatus('validating...');
}

Controller.prototype.send = function(info, func) {
    $.post('api', info, func);
}

Controller.prototype.receive = function(data) {
    console.log(data);
}

$(document).ready(new Controller());