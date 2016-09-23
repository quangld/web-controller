/***
 * Handling GPIO states to control connected device
 */
var rpio = require('rpio');
var Controller = function(config) {
    
    this.__GPIOMap = config.GPIOMap;
    this.__pushedTime = config.pushedTime;
    this.__ON = (config.OFFState===1) ? rpio.LOW : rpio.HIGH;
    this.__OFF = (this.__ON===rpio.HIGH) ? rpio.LOW : rpio.HIGH;
    //set controlled gpio pins to output mode
    for (let p in config.GPIOMap) {
        rpio.open(config.GPIOMap[p], rpio.OUTPUT);
        rpio.write(config.GPIOMap[p], this.__OFF);
    }
}

//set gpio pin to ON for a period of time (__pushedTime) and then OFF
Controller.prototype.click = function(button) {
    let _this=this;
    if (button in this.__GPIOMap) {
        console.log('Pushed', button, this.__GPIOMap[button]);
        let pin = this.__GPIOMap[button];
        rpio.write(pin, this.__ON);
        setTimeout(function() {
            rpio.write(pin, _this.__OFF);
        }, this.__pushedTime);
    }
    if ((button=='Up') && this.config.upTimeout) {
        this.autoStop();
    }
}

//automatically stop when rolling up
Controller.prototype.autoStop = function() {
    let _this = this;
    if (this.config.upTimeoutHandle) {
        clearTimeout(this.upTimeoutHandle);
    }
    this.upTimeoutHandle = setTimeout(function() {
        _this.click('Unlock');
    }, this.config.upTimeout)
} 

//set gpio pin to ON 
Controller.prototype.hold = function(button) {}
//set gpio pin to OFF
Controller.prototype.release = function(button) {}

module.exports = Controller;