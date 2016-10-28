/**
 * This facebook messenger bot sends messages to a defined user (by ID) via Facebook messenger platform
 */
'use strict'
var request = require('request')

var FBNotifer = function (fbAppToken, fbManagerID) {
  this.fbAppToken = fbAppToken
  this.fbManagerID = fbManagerID.split(',')
}

FBNotifer.prototype.send = function (text, id) {
  if (!text || !this.fbManagerID || !this.fbAppToken) return
  if (!id) {
    console.log(this.fbManagerID)
    if ((this.fbManagerID instanceof Array) && (this.fbManagerID.length > 0)) {
      for (let id of this.fbManagerID) {
        this.send(text, id)
      }
      return
    }
    id = this.fbManagerID
  }
  if (id && (id.length > 10)) {
    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {
        access_token: this.fbAppToken
      },
      method: 'POST',
      json: {
        recipient: {
          id: id
        },
        message: {
          text: text
        }
      }
    }, function (error, response) {
      if (error) {
        console.log('Error sending notification: ', error)
      } else if (response.body.error) {
        console.log('Error: ', response.body.error)
      }
    })
  } else {
    console.log('Invalid ID', id)
  }
}

module.exports = FBNotifer
