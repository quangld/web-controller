/**
 * Managing room information: room number, name, passcode, permission
 */
'use strict'

var crypto = require('crypto')

var RoomManager = function (rooms) {
  this.rooms = rooms
}

// return result (err, message) : err=null is a success
RoomManager.prototype.update = function (room) {
    // New Room when room.oldRoomId = 0 else updated
    // if id<0, delete room
  room.id = parseInt(room.id)
  if (room.id == 0)
    return ({
      err: true,
      message: 'Room Number can not be zero'
    })
  if (!this.isRoomNumberValid(Math.abs(room.id)))
    return ({
      err: true,
      message: 'Room Number must be between 100..999'
    })

  if (room.id < 0) {
    if (Math.abs(room.id) == room.oldRoomId) {
      let i = this.rooms.findIndex(function (r) {
        return r.id == room.oldRoomId
      })
      if (i >= 0) {
        delete this.rooms[i]
        return ({
          err: false,
          message: 'Room ' + room.oldRoomId + ': deleted!'
        })
      }
    }
    return ({
      err: true,
      message: 'Can NOT delete Room ' + room.id
    })
  } else {
    if (room.oldRoomId == 0) {
            // add new
      if (!this.isRoomNumberValid(room.id))
        return ({
          err: true,
          message: 'Room Number must be between 100..999'
        })
      let r = this.getRoomInfo(room.id)
      if (!r) {
        if (!this.isPassValid(room.pass))
          return ({
            err: true,
            message: 'Passcode provided for room ' + room.id + ' is invalid'
          })
        delete room.oldRoomId
        this.rooms.push(room)
        return ({
          err: false,
          message: 'Room ' + room.id + ': added!'
        })
      } else {
        return ({
          err: true,
          message: 'Can NOT add: Room ' + room.id + ' already exists'
        })
      }
    } else {
      let r = this.getRoomInfo(room.oldRoomId)
      if (r) {
        if (room.pass) {
          if (this.isPassValid(room.pass))
            r.pass = room.pass
          else
                        return ({
                          err: true,
                          message: 'Passcode provided for room ' + room.id + ' is invalid'
                        })
        }
        if (r.id != room.id) r.id = room.id
        if (room.name && (r.name != room.name)) r.name = room.name
        return ({
          err: false,
          message: 'Room ' + room.id + ': updated!'
        })
      } else {
        return ({
          err: true,
          message: 'Can NOT update: Room ' + room.oldRoomId + ' does NOT exists'
        })
      }
    }
  }
}

RoomManager.prototype.isRoomNumberValid = function (id) {
  return !isNaN(id) && (id >= 100) && (id <= 999)
}
RoomManager.prototype.isPassValid = function (pass) {
  return /^\d{4,}$/.test(pass)
}

RoomManager.prototype.login = function (id, code, salt) {
  let room = this.getRoomInfo(id)
  let granted = ((room != null) && (this.sha256(room.id + '' + room.pass + salt) === code))
  return granted ? room : null
}

// returns sha256 hash of a string
RoomManager.prototype.sha256 = function (str) {
  return crypto.createHash('sha256').update(str).digest('hex')
}

RoomManager.prototype.getRoomInfo = function (id) {
  return this.rooms.find(function (e) {
    return e.id == id
  })
}

module.exports = RoomManager
