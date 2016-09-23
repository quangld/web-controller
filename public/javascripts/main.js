var Controller = function() {
    var _this = this;
    this.code = '';
    this.salt = '';
    this.pages = $('div.content');
    this.rooms = $('#settings #rooms');
    this.currentRoom = null;
    this.show('keypad');
    this.setStatus('Refresh this page or notify admin');

    this.getSalt(function() {
        $('.btn').on('click', function(e) {
            _this.btnHandler(e);
        });
        _this.roomForm = $('#roomForm').show().detach();
        _this.setStatus();
    });
    //this.openSettings();
}

Controller.prototype.pageRefresh = function() {

}

Controller.prototype.getSalt = function(func) {
    let _this = this;
    //get salt for encrypting message
    this.send({
        type: 'salt'
    }, function(data) {
        if (!data.err && data.salt) {
            _this.salt = data.salt;
            func.apply(_this);
        }
    });
}

Controller.prototype.setStatus = function(str, type, delay) {
    var lblStatus = this.currentPage.children("#status");
    if (lblStatus.length > 0) {
        if (type) lblStatus.removeClass().addClass(type.length > 0 ? 'text-' + type : 'text-default');
        lblStatus.text(str ? str : lblStatus.attr('default'));
        if (delay > 0) {
            var _this = this;
            if (this.lblStatusTimeout)
                clearTimeout(this.lblStatusTimeout);
            this.lblStatusTimeout = setTimeout(function() {
                lblStatus.removeClass();
                lblStatus.text(lblStatus.attr('default'));
                _this.lblStatusTimeout.null;
            }, delay);
        }
    }
}

Controller.prototype.input = function(code) {
    if (code) {
        this.code += code;
        this.setStatus('************************'.substr(0, this.code.length - 1) + code);
    }
    ((this.code.length < 7) || (!this.salt)) ? $('#bEnter').hide(): $('#bEnter').show();
    (this.code.length <= 0) ? $('#bClear').hide(): $('#bClear').show();

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
        case 'Lock':
        case 'Unlock':
            this.send({
                digikey: this.digikey,
                type: id
            }, function(data) {
                //
            })
            break;
        case 'RoomAdd':
        case 'RoomUpdate':
        case 'RoomDelete':
        case 'RoomCancel':
            if (typeof this['click' + id] == 'function')
                this['click' + id]();
            break;
        case 'Settings':
            if (this.admin)
                this.openSettings();
            break;
        case 'Back':
            if ($('div.content#settings').is(':visible'))
                this.show('controller');
            else if ($('div.content#controller').is(':visible')) {
                this.show('keypad');
                clearTimeout(this.countDownHandle);
                $('#timer').hide();
                this.setStatus();
            }
            break;
    }
}

Controller.prototype.openSettings = function() {
    var _this = this;
    this.show('settings');
    this.send({
        digikey: this.digikey,
        type: 'settings'
    }, function(data) {
        if (!data) return;
        if (Array.isArray(data.rooms) && (data.rooms.length > 0)) {
            _this.rooms.empty();
            for (r of data.rooms) {
                var div = $('<div class="list-group-item"></div>');
                var btn = $('<div>Room ' + r.id + ': ' + r.name + '</div>')
                div.append(btn);
                btn.data(r);
                btn.click(function(e) {
                    _this.btnRoomOnClick($(e.target));
                })
                _this.rooms.append(div);
            }
        }
        if (data.fbManagerID) {
            $('#settings #facebookID').val(data.fbManagerID);
        }
        if (data.timeout) {
            _this.countDown((new Date).getTime() + data.timeout * 1000);
        }
    });

    $('#facebookID').change(function() {
        console.log('update facebook id');
    });
}

Controller.prototype.btnRoomOnClick = function(btn) {
    var _this = this;
    if (this.currentRoom) {
        this.clickRoomCancel();
    }
    this.currentRoom = btn;
    btn.hide();
    btn.after(this.roomForm);
    r = btn.data();
    this.roomForm.find('#roomNumber').val(r.id ? r.id : '');
    this.roomForm.find('#roomName').val(r.name);
    this.roomForm.find('#roomPass').val('');
    this.rooms.find('div.list-group-item').addClass('Gray')
    btn.parent().removeClass('Gray');
    this.roomForm.find(r.id ? '#roomPass' : '#roomNumber').focus();
}


Controller.prototype.clickRoomAdd = function() {
    var _this = this;
    var div = $('<div class="list-group-item"></div>');
    var btn = $('<div>New Room</div>')
    div.append(btn);
    this.rooms.append(div);
    btn.data({
        id: 0,
        name: ''
    });
    btn.click(function(e) {
        _this.btnRoomOnClick($(e.target));
    });
    btn.click();
}

Controller.prototype.getFormInfo = function() {
    return {
        id: this.roomForm.find('#roomNumber').val().trim(),
        name: this.roomForm.find('#roomName').val().trim(),
        pass: this.roomForm.find('#roomPass').val().trim()
    }
}

Controller.prototype.isRoomNumberValid = function(id) {
    //room number must be [100...999] 3 digit keys
    return !isNaN(id) && (id >= 100) && (id <= 999);
}
Controller.prototype.isNameValid = function(name) {
    //Name must no be blank
    return (typeof name == 'string') && (name.length > 0);
}
Controller.prototype.isPassValid = function(pass) {
    //password length must be number with at least 4 digits, can starts with 0
    return /^\d{4,}$/.test(pass);
}

Controller.prototype.isRoomInfoValid = function(room) {
    return this.isRoomNumberValid(room.id) && this.isNameValid(room.name) && this.isPassValid(room.pass);
}

Controller.prototype.clickRoomUpdate = function() {
    var _this = this;
    //make sure the room number is not existing
    var room = this.getFormInfo();
    room.oldRoomId = this.currentRoom.data().id;
    if (!this.isRoomNumberValid(room.id)) {
        this.setStatus('Room number must be between 100 and 999', 'danger', 4000);
        return;
    }

    if (!this.isNameValid(room.name)) {
        this.setStatus('Name is needed', 'danger', 4000);
        return;
    }
    if (room.pass && !this.isPassValid(room.pass)) {
        this.setStatus('Password must have at least 4 numbers', 'danger', 4000);
        return;
    }

    this.send({
        digikey: this.digikey,
        type: 'update',
        room: room
    }, function(result) {
        if (result.err) {
            _this.setStatus(result.message, 'danger', 4000);
        } else {
            _this.roomForm.detach();
            _this.setStatus(result.message, 'success', 4000);
            _this.currentRoom = null;
            _this.openSettings();
        }
    })

}

Controller.prototype.clickRoomDelete = function() {
    var _this = this;
    var room = this.getFormInfo();
    if ((room.id >= 100) && (room.id <= 999)) {
        room.id = -room.id;
        room.oldRoomId = this.currentRoom.data().id;
        //room in negative, means delete it
        this.send({
            digikey: this.digikey,
            type: 'update',
            room: room
        }, function(result) {
            if (result.err) {
                _this.setStatus(result.message, 'danger', 4000);
            } else {
                _this.setStatus(result.message, 'success', 4000);
                _this.roomForm.detach();
                _this.rooms.find('div.list-group-item').removeClass('Gray');
                _this.currentRoom.parent().remove();
                _this.currentRoom = null;
            }
        })

    }
}

Controller.prototype.clickRoomCancel = function() {
    this.roomForm.detach();
    this.rooms.find('div.list-group-item').removeClass('Gray');
    if (this.currentRoom) {
        this.currentRoom.show();
        var r = this.currentRoom.data();
        if (!r.id)
            this.currentRoom.parent().remove();
    }
    this.currentRoom = null;
}

Controller.prototype.clearPasscode = function() {
    this.code = '';
    this.setStatus();
    $('#bEnter').hide();
    $('#bClear').hide();
}

Controller.prototype.reset = function() {
    this.digikey = null;
    this.show('keypad');
    this.clearPasscode();
}

Controller.prototype.show = function(page) {
    this.currentPage = this.pages.hide().filter('#' + page).show();
    if (page == 'keypad') {

    }
    //console.log(this.currentPage);
}

Controller.prototype.countDown = function(expires) {
    var now = (new Date).getTime();
    if (now > expires) {
        $('#timer').hide();
        this.reset();
        this.countDownHandle = null;
    } else {
        $('#timer').show();
        var _this = this;
        if (this.countDownHandle) {
            clearTimeout(this.countDownHandle);
        }
        this.countDownHandle = setTimeout(function() {
            _this.countDown(expires);
        }, 1000);
        $('#timer').text('Automatically log out in ' + Math.round((expires - now) / 1000) + ' seconds');
    }
}

Controller.prototype.submitPasscode = function() {
    var _this = this;
    //console.log(this.code+''+this.salt,sha256(this.code+''+this.salt));
    this.send({
        type: 'login',
        room: this.code.substr(0, 3),
        code: sha256(this.code + this.salt)
    }, function(data) {
        if (data.digikey) {
            _this.digikey = data.digikey;
            _this.show('controller');
            _this.admin = data.admin;
            if (data.admin) {
                $('button#bSettings').show();
            } else {
                $('button#bSettings').hide();
            }
            _this.countDown((new Date()).getTime() + data.timeout * 1000);
        } else {
            _this.setStatus('Invalid Passcode!' + ((data.tries > 1) ? ' (' + data.tries + ' times)' : ''));
        }
        if (data.salt)
            _this.salt = date.salt;
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