function AssetServer(pipe) {
  this.pipe = pipe
}

AssetServer.prototype.middleware = function() {
  var that = this
  return function (req, res, next) {
    var url = req.url.replace(/\?.*/i, "")
    that.pipe.fileFromUrl(url, next, function(err, contents, fileType) {
      if(err) {
        res.writeHead(500, { 'Content-Length': err.toString().length, 'Content-Type': 'text/plain' })
        res.end(err.toString())
      } else {
        res.writeHead(200, { 'Content-Length': contents.length, 'Content-Type': fileType })
        res.write(contents, 'utf8')
        res.end()
      }
    })
  }
}

module.exports = AssetServer
