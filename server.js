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
  //remove clients who have not sent us ops
  var opsList = []
    , clientsWithOps = []
    , ops
  var clientsWithOperations = _(clients).each(function(c) {
    if(c.ops) {
      opsList.push(c.ops)
      clientsWithOps.push(c.id)
    }
  })
  if(opsList.length !== 0) {
    ops = _(opsList).reduce(function(mergedOps, ops) {
      if(ops) {
        return ot.merge(mergedOps, ops)
      } else {
        return mergedOps
      }
    }) 
  }
  return { ops: ops, respondedClients: clientsWithOps }
}
var numSyncs = 0

function sync() {
  console.log("syncing")
  var thisSync = ++numSyncs
  if(clients.length === 0) {
    setTimeout(sync, 200)
    return
  }

  var merged = mergeOps()
  if(merged.ops) {
    document = ot.apply(document, merged.ops)
  }

    var clientsResponded = 0
      , clientsSyncing = clients.length
      , startTime = (new Date).getTime()


  clients.forEach(function (client) {
    var sendOps
    //keep track of which round of syncs this callback is for
      , mySyncNumber = numSyncs
    if(merged.ops) {
      sendOps = ot.removeOwnOperations(merged.ops, client.id)
    }
    client.socket.emit("sync", sendOps, merged.respondedClients, function(operations) {
      //this client responded too late, latency may be too high ( > 600 )
      if(thisSync !== numSyncs) {
        return
      }
      console.log("got response")
      client.ops = operations
      if(++clientsResponded === clientsSyncing) {
        setTimeout(sync, 100)
      }
    })  
  })
  //if clients take longer than 600ms to respond, force the 
  //application of operations
  setTimeout(600, function() {
    //we're still waiting for someone to respond...drop em
   if(thisSync === numSyncs) {
     console.log("restarting")
      sync()
    }
  })
}

sync()

sio.sockets.on('connection', function (socket) {
  var client = { socket: socket, id: clientId }
  clients.push(client)
  socket.emit('init', { clientId: clientId, document: document })
  clientId++
  socket.on('disconnect', function() {
    clients.splice(clients.indexOf(client), 1)
    //force sync after disconnect
    sync()
  })
})
