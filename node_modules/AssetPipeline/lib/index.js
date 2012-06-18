var fs = require("fs")
  , path = require("path")
  , AssetServer = require("./server_middleware")
  , _ = require("underscore")
  , ScriptPipeline = require("./script_pipeline")
  , StylesheetPipeline = require("./stylesheet_pipeline")
  , ImagePipeline = require("./image_pipeline")
  , HtmlPipeline = require("./html_pipeline")
  , pro = require("uglify-js").uglify
  , jsp = require("uglify-js").parser
  , concatCache

var AssetPipe = module.exports = function() {
  this.allFiles = []
  this.pipes = []
  this.server = new AssetServer(this)
}

AssetPipe.prototype.script = function() {
  var scriptPipe = new ScriptPipeline(this)
  this.pipes.push(scriptPipe)
  return scriptPipe 
}
 
AssetPipe.prototype.image = function() {
  var imagePipe = new ImagePipeline(this)
  this.pipes.push(imagePipe)
  return imagePipe 
}
 
AssetPipe.prototype.stylesheet = function() {
  var stylePipe = new StylesheetPipeline(this)
  this.pipes.push(stylePipe)
  return stylePipe 
}
  
AssetPipe.prototype.html = function() {
  var htmlPipe = new HtmlPipeline()
  this.pipes.push(htmlPipe)
  return htmlPipe 
}
 
AssetPipe.prototype.fileFromUrl = function(url, next, callback) {
  var found = false
    , scripts = ""
    , pre = ""
    , post = ""
    , numDone = 0
  //TODO this needs to be done with streams!
  if(url === "/js/concat.js") {
    var done = function(contents) {
      if(concatCache) {
        return callback(null, concatCache, "text/javascript")
      }
      contents = ";(function(window, undefined) {" + contents + "}(window, undefined))"

      var ast = jsp.parse(contents)
      ast = pro.ast_mangle(ast, {toplevel: true})
      ast = pro.ast_squeeze(ast)
      var finalCode = pro.gen_code(ast)
      //HACK: add newline because IDK why last two chars gettin chopped
      concatCache = finalCode + "  \n"
      callback(null, concatCache, "text/javascript")
    }

    _(this.pipes).each(function(pipe) {

      if(typeof pipe.getScriptsContents === "function") {

        numDone += 3

        pipe.getPreScriptsContents(function(err, contents) {
          if(!contents) {
            --numDone
            return
          }
          pre += "\n;" + contents
          if(--numDone === 0) {
            done(pre + "\n;" + scripts + "\n;" + post)
          }
        })
        pipe.getScriptsContents(function(err, contents) {
          if(!contents) {
            --numDone
            return
          }
          scripts += "\n;" + contents
          if(--numDone === 0) {
            done(pre + "\n;" + scripts + "\n;" + post)
          }
        })
        pipe.getPostScriptsContents(function(err, contents) {
          if(!contents) {
            --numDone
            return
          }
          post += "\n;" + contents
          if(--numDone === 0) {
            done(pre + "\n;" + scripts + "\n;" + post)
          }
        })
      }
    })
  } else {
    _(this.pipes).each(function(pipe) {
      if(pipe.urlToFile(url)) {
        found = true
        pipe.get(url, function(err, data, fileType) {
          if(!err || err.code !== 'ENOENT') {
            callback(err, data, fileType)
          }
        })
      }
    })
    if(!found) {
      next()
    }
  }
}

AssetPipe.prototype.scriptTags = function() {
  if(process.env.NODE_ENV.toLowerCase() === "production") {
    //this needs to be some sort of md5 or something.
    return '<script src = "/js/concat.js"></script>'
  }

  var scriptTags = ""
    , preTags = ""
    , postTags = ""
  _(this.pipes).each(function(pipe) {
    if(typeof pipe.getScriptTags === "function") {
      preTags += pipe.getScriptTags({pre: true}) || ""
      postTags += pipe.getScriptTags({post: true}) || ""
      scriptTags += pipe.getScriptTags() || ""
    }
  })
  return preTags + scriptTags + postTags
}

AssetPipe.prototype.watchFiles = function(socket) {
  _(this.pipes).each(function(pipe) {
    if(typeof pipe.watchFiles === "function") {
      pipe.watchFiles(socket)
    }
  })
} 

module.exports = AssetPipe
