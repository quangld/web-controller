var Controller = function () {
  var _this = this
  this.salt = ''
  this.pages = $('div.content')
  this.show('keypad')
  this.setStatus('Refresh this page or notify admin')
  this.getSalt(function () {
    $('.btn').on('click', function (e) {
      _this.btnHandler(e)
    })
    _this.setStatus()
  })
  // this.openSettings();
  $('input#passcode').keyup(function (e) {
    var code = e.target.value
    _this.setStatus(Array(code.length).join('*') + code.charAt(code.length - 1))
    if ((e.which == 13) || (e.keyCode == 13)) {
      _this.submitPasscode()
    }
  })

  this.startTime = Date.now()
  this.onFocus = true
  $(window).focus(function () {
    if (!_this.onFocus) {
      location.reload()
    }
  }).blur(function () {
    _this.onFocus = false
  })
}

Controller.prototype.pageRefresh = function () {

}

Controller.prototype.getSalt = function (func) {
  var _this = this
  // get salt for encrypting message
  this.send({
    type: 'salt'
  }, function (data) {
    if (!data.err && data.salt) {
      _this.salt = data.salt
      func.apply(_this)
    }
  })
}

Controller.prototype.setStatus = function (str, type, delay) {
  var lblStatus = this.currentPage.children('#status')
  if (lblStatus.length > 0) {
    if (type) lblStatus.removeClass().addClass(type.length > 0 ? 'text-' + type : 'text-default')
    lblStatus.text(str ? str : lblStatus.attr('default'))
    if (delay > 0) {
      var _this = this
      if (this.lblStatusTimeout)
        clearTimeout(this.lblStatusTimeout)
      this.lblStatusTimeout = setTimeout(function () {
        lblStatus.removeClass()
        lblStatus.text(lblStatus.attr('default'))
        _this.lblStatusTimeout.null
      }, delay)
    }
  }
}

Controller.prototype.btnHandler = function (e) {
  var id = e.target.id
  if (id.charAt(0) != 'b') return
  id = id.substr(1)
  switch (id) {
    case 'Enter':
      this.submitPasscode()
      break
    case 'Up':
    case 'Down':
    case 'Stop':
    case 'Lock':
    case 'Unlock':
      this.send({
        digikey: this.digikey,
        type: id
      }, function (data) {
        //
      })
      break

    case 'Back':
      if ($('div.content#controller').is(':visible')) {
        this.show('keypad')
        clearTimeout(this.countDownHandle)
        $('#timer').hide()
        this.setStatus()
      }
      break
  }
}

Controller.prototype.clearPasscode = function () {
  $('input#passcode').val('')
  this.setStatus()
}

Controller.prototype.reset = function () {
  this.digikey = null
  this.show('keypad')
  this.clearPasscode()
}

Controller.prototype.show = function (page) {
  this.currentPage = this.pages.hide().filter('#' + page).show()
  if (page == 'keypad') {
    this.clearPasscode()
  }
}

Controller.prototype.countDown = function (expires) {
  var now = (new Date()).getTime()
  if (now > expires) {
    $('#timer').hide()
    this.reset()
    this.countDownHandle = null
  } else {
    $('#timer').show()
    var _this = this
    if (this.countDownHandle) {
      clearTimeout(this.countDownHandle)
    }
    this.countDownHandle = setTimeout(function () {
      _this.countDown(expires)
    }, 1000)
    $('#timer').text('Automatically log out in ' + Math.round((expires - now) / 1000) + ' seconds')
  }
}

Controller.prototype.submitPasscode = function () {
  var _this = this
  this.setStatus('Validating...')
  var code = $('input#passcode').val()
  this.send({
    type: 'login',
    room: code.substr(0, 3),
    code: sha256(code + this.salt)
  }, function (data) {
    if (data.digikey) {
      _this.digikey = data.digikey
      _this.show('controller')
      _this.countDown((new Date()).getTime() + data.timeout * 1000)
    } else {
      if ((Date.now() - this.startTime) >= 10 * 60 * 1000) {
        this.show('refresh')
      }
      _this.setStatus(((data.tries > 1) ? 'Still Failed! Click above Welcome Home to refresh' : 'Invalid Passcode'))
    }
    if (data.salt)
      _this.salt = data.salt
  })
}

Controller.prototype.send = function (info, func) {
  $.post('api', info, func)
}

Controller.prototype.receive = function (data) {
  console.log(data)
}
if (/Chrome/.test(navigator.userAgent))
  location.href = '/chrome.html'
$(document).ready(new Controller())

