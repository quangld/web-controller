var express = require('express')
var app = express()
var api = require('./routes/api')
var root = require('./routes/root')
var session = require('express-session')
var bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({extended: true}))
app.use(session({
  secret: 'iDontWantY0Utoknow',
  resave: false,
  saveUninitialized: true,
  maxAge: 5 * 60 * 1000
}))

app.use('/', root)
/* serves all the static files */
app.use(express.static('public'))
app.use('/api', api)

var port = process.env.PORT || 3000
app.listen(port, function () {
  console.log('Listening on ' + port)
})
