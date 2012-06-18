var path = require("path")
  , _ = require("underscore")
  , util = require("util")
  , Pipeline = require("./pipeline")

function ImagePipeline() {
  Pipeline.call(this)
  this.config.urlPrefix = "/images"
  this.config.urlExtension = /\.(jpg|png|gif)/i
}

util.inherits(ImagePipeline, Pipeline)

ImagePipeline.prototype.serveDefault = function() {
  this.root(__dirname + "/../assets/img")
  this.addFiles(__dirname + "/../assets/img")
}
 

module.exports = ImagePipeline
