process.env.NODE_ENV = "development"

var express         = require("express")
  , io              = require("socket.io")
  , fs              = require("fs")
  , ot              = require("./transform")
  , setInterval     = require("timers").setInterval
  , setTimeout     = require("timers").setTimeout
  , app             = express.createServer()
  , clientId        = 0
  , numClients      = 0
  , document        = []
  , AssetPipe       = require("AssetPipeline/lib/index")
  , ModuleProcessor = require("AssetPipeline/lib/processors/module")
  , assetPipe       = new AssetPipe()


assetPipe.script()
  .addFiles("AssetPipeline/lib/client/require", {pre: true}) 
assetPipe.script()
  .root(__dirname)
  .addFiles("sax/lib/sax")
  .addFiles(__dirname + "/transform.js")
  .process(ModuleProcessor(__dirname))

app.use(assetPipe.server.middleware())

app.get('/', function(req, res) {
  res.setHeader('Content-Type', 'text/html;charset=utf-8')
  res.send(fs.readFileSync(__dirname + "/index.html", 'utf-8'))
})

app.listen(3000)

var sio = io.listen(app)
  , clientResponses = []
  , clientsResponded = 0

sio.set('log level', 0)

var syncing = false
function allClientsResponded() {
  setTimeout(function() {
    if(clientResponses[0] && clientResponses[1]) {
      var merged = ot.merge(clientResponses[0].ops, clientResponses[1].ops)
      document = ot.apply(document, merged)
      clientResponses[0].socket.emit("update", ot.removeOwnOperations(merged, clientResponses[0].cid), document)
      clientResponses[1].socket.emit("update", ot.removeOwnOperations(merged, clientResponses[1].cid), document)
    }
    clientResponses = []
    clientsResponded = 0
    syncing = false
  }, 500)
}

setInterval(function() {
  var clients = sio.sockets.clients()
    , clientsSyncing = clients.length
  if(!syncing && clientsSyncing > 0) {
    syncing = true
    clients.forEach(function (socket) {
      socket.emit("sync", function(clientId, operations) {
        clientResponses.push({ ops: operations, socket: socket, cid: clientId})
        if(++clientsResponded === clients.length) {
          allClientsResponded()
        }
      })  
    })
  }
}, 200)

sio.sockets.on('connection', function (socket) {

  socket.emit('init', { clientId: clientId, document: document })
  clientId++
  socket.on('disconnect', function() {})
})
