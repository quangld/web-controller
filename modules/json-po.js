/**
 * Persistence Object using Proxy ES6
 * JsonPO object loads object from a json file, detects its properties changed and save it to that file
 * @author: Quang Le
 * @date: September 17, 2016
 **/
'use strict'
var fs = require('fs')
var JsonPO = function (source, value) {
  let data = {}
  let initializing = false
  if (typeof source == 'string') {
    try {
            // readFileSync is recommended, since we only need to read json file once
            // console.log(source);
      data = JSON.parse(fs.readFileSync(source))
            // console.log(data);
    } catch (err) {
            // throw err;
      console.error(err)
    }
  } else if (typeof value == 'object') {
    data = value
  }

    // using proxy to watch for changes
  let proxy = new Proxy(data, {
    set: function (obj, prop, value, receiver) {
      obj[prop] = (typeof value == 'object') ? new JsonPO(this, value) : value
      if ((prop === 'length') && (typeof obj == 'object')) return true
      this.__save()
      return true
    },

    deleteProperty: function (target, prop) {
      console.log('Delete', typeof prop, prop, target[prop])
      if (target instanceof Array) {
        target.splice(prop, 1)
        this.__save()
      } else if (prop in target) {
        this.__save()
      }
      return true
    },

    __save: function () {
      if (typeof source == 'object') {
                // console.log('changed in child');
        source.__save()
      } else if ((typeof source == 'string') && (!initializing)) {
                // saved to file
        console.log('File saved')
                // can't use the async writeFile, because if object changed too fast, written fast got mess up.
                // will find a better solution for this
        fs.writeFileSync(source, JSON.stringify(data, null, 2))
      }
    }

  })

  if (data && (typeof data == 'object')) {
    initializing = true // prevent writing to file while converting children objects
    for (let p in data) {
      if (typeof data == 'object') {
                // turns children objects to obserable objects;
        proxy[p] = data[p]
      }
    }
    initializing = false
  }
  return proxy
}

module.exports = JsonPO
