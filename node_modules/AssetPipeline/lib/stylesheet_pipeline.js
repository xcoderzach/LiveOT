var Pipeline = require("./pipeline")
  , util = require("util")
  , path = require("path")
  , fs = require("fs")
  , less = require("./processors/less")

function StylesheetPipeline() {
  Pipeline.call(this)
  this.config.urlPrefix = "/stylesheets"
  this.config.fileExtension = ".css"
  this.config.urlExtension = ".css"
}       

util.inherits(StylesheetPipeline, Pipeline)

StylesheetPipeline.prototype.watchFiles = function(socket) {
  var that = this
  _(this.files).each(function(file) {
    fs.watchFile(file, function(curr, prev) {
      if(curr.mtime.getTime() !== prev.mtime.getTime()) {
        console.log("changed")
        socket.emit("StylesheetChange", that.fileToUrl(file))
      }
    })
  })
  return this
}

StylesheetPipeline.prototype.serveDefault = function() {
  this.urlPrefix("/css")
  this.fileExtension(".less")
  this.root(path.resolve(__dirname + "/../assets/less"))
  this.process(less)
  this.addFiles(path.resolve(__dirname + "/../assets/less"))
  return this
}
 
module.exports = StylesheetPipeline
