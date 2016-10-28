/**
 * a Dump controller interface used for development
 */

var Controller = function (config) {
  this.config = config
}

// click action: button is pushed (for a set time) and released
Controller.prototype.click = function (button) {
  console.log(button, ' is clicked')
  if ((button == 'Up') && this.config.autoStopDelay) {
    this.autoStop()
  }
}

// automatically stop when rolling up
Controller.prototype.autoStop = function () {
  let _this = this
  if (this.autoStopHandle) {
    clearTimeout(this.autoStopHandle)
  }
  setTimeout(function () {
    _this.click('Unlock')
  }, this.config.autoStopDelay)
}

// hold action: button is hold (set switch to ON)
Controller.prototype.hold = function (button) {}
// release action: button is released (set switch to OFF)
Controller.prototype.release = function (button) {}

module.exports = Controller
