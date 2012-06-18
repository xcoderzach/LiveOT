var path = require("path")
  , fs = require("fs")
  , _ = require("underscore")
  , util = require("util")
  , Pipeline = require("./pipeline")

function ScriptPipeline() {
  Pipeline.call(this)
  this.type = "script"
  this.config.urlPrefix = "/modules"
  this.config.fileExtension = ".js"
  this.config.urlExtension = ".js"
}       

util.inherits(ScriptPipeline, Pipeline)

function fileExists(file) {
  var file = file
    , suffix = ["", ".js", "/index.js"]
    , i
  for(i = 0 ; i < suffix.length ; i++) {
    try {
      fs.statSync(file + suffix[i])
      return file + suffix[i]

    } catch(e) {} 
  }
  return false
}

function resolveNodeModuleRequireWithDirs(base, dir) {
  var file = path.resolve(path.join(base, "node_modules", dir))
  file = fileExists(file)
  if(file) {
    return file
  }
  if(base !== "/") {
    return resolveNodeModuleRequireWithDirs(path.resolve(path.join(base, "..")), dir)
  } else {
    throw new Error("can't find file: " + dir)
  }
}

ScriptPipeline.prototype.resolve = function(file) {
  //try to resolve the file as a module
  if(file[0] !== "." && file[0] !== "/") {
    file = resolveNodeModuleRequireWithDirs(this.root, file)
  } else {
    file = path.resolve(file)
  }
  return file
}

ScriptPipeline.prototype.getScriptTag = function(url) {
  return '<script src = "' + url + '"></script>'
}

ScriptPipeline.prototype.getScriptsContents = function(callback, files) {
  var that = this
    , numDone
    , contents = ""

  files = files || this.files
  numDone = files.length
  if(files.length === 0) {
    callback(null, "")
  }

  _(files).each(function(file) {
    var url = that.fileToUrl(file)
    that.readFile(file, url, function(err, newContents) {
      if(!newContents) {
        --numDone
        return
      }
      if(err) {
        return callback(err)
      }
      contents += newContents
      if(--numDone === 0) {
        callback(err, contents)
      }
    })
  })
}

ScriptPipeline.prototype.getPreScriptsContents = function(callback) {
  this.getScriptsContents(callback, this.pre)
}

ScriptPipeline.prototype.getPostScriptsContents = function(callback) {
  this.getScriptsContents(callback, this.post)
}

ScriptPipeline.prototype.getScriptTags = function(opts) {

  opts = opts || {}

  var files

  if(opts.pre) {
    files = this.pre
  } else if(opts.post) {
    files = this.post
  } else {
    files = this.files
  }

  var scriptUrls = _(files).map(this.fileToUrl, this)
    , scriptTags = _(scriptUrls).map(this.getScriptTag, this)

  return scriptTags.join("\n") + "\n"
}

module.exports = ScriptPipeline
