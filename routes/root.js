var express = require('express')
var router = express.Router()
var useragent = require('useragent')

router.get('/', function (req, res, next) {
  var agent = useragent.parse(req.headers['user-agent'])
  console.dir(agent.source)
  next()
})

module.exports = router
