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
  , _               = require("underscore")
  , assetPipe       = new AssetPipe()


assetPipe.script()
  .addFiles("AssetPipeline/lib/client/require", {pre: true}) 
assetPipe.script()
  .root(__dirname)
  .addFiles("sax/lib/sax")
  .addFiles("underscore")
  .addFiles(__dirname + "/transform.js")
  .process(ModuleProcessor(__dirname))

app.use(assetPipe.server.middleware())

app.get('/', function(req, res) {
  res.setHeader('Content-Type', 'text/html;charset=utf-8')
  res.send(fs.readFileSync(__dirname + "/index.html", 'utf-8'))
})

app.listen(3000)

var sio = io.listen(app)
  , clients = []

sio.set('log level', 0)

function mergeOps() {
  var opsList = _(_(clients).pluck("ops")).filter(function(o) {
    return o
  })
  if(!opsList.length) {
    return
  }
  
  return _(opsList).reduce(function(mergedOps, ops) {
    if(ops) {
      return ot.merge(mergedOps, ops)
    }
    return mergedOps
  }) 
}

function sync() {

  if(clients.length === 0) {
    setTimeout(sync, 200)
    return
  }

  var merged = mergeOps()
  if(merged) {
    document = ot.apply(document, merged)
  }

    var clientsResponded = 0
      , clientsSyncing = clients.length
      , startTime = (new Date).getTime()


  clients.forEach(function (client) {
    var sendOps
    if(merged) {
      sendOps = ot.removeOwnOperations(merged, client.id)
    }
    client.disconnect = function() {
      if(clientsResponded === --clientsSyncing) {
        setTimeout(sync, 10)
      }
    }
    client.socket.emit("sync", sendOps, function(operations) {
      client.ops = operations
      if(++clientsResponded === clientsSyncing) {
        setTimeout(sync, 10)
      }
    })  
  })
}

sync()

sio.sockets.on('connection', function (socket) {
  var client = { socket: socket, id: clientId }
  clients.push(client)
  socket.emit('init', { clientId: clientId, document: document })
  clientId++
  socket.on('disconnect', function() {
    var c = clients.splice(clients.indexOf(client), 1)
    if(typeof c.disconnect === "function") {
      c.disconnect()
    }
  })
})
