/**
 * This facebook messenger bot sends messages to a defined user (by ID) via Facebook messenger platform
 */
'use strict';
var request = require('request');

var FBNotifer = function(fbAppToken, fbManagerID) {
    this.fbAppToken = fbAppToken;
    this.fbManagerID = fbManagerID;
}

FBNotifer.prototype.send = function(text) {
    if (!text || !this.fbManagerID || !this.fbAppToken) return;
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: this.fbAppToken
        },
        method: 'POST',
        json: {
            recipient: {
                id: this.fbManagerID
            },
            message: {
                text: text
            }
        }
    }, function(error, response) {
        if (error) {
            console.log('Error sending notification: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

module.exports = FBNotifer;