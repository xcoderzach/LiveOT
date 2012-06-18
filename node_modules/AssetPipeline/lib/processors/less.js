var stylus = require("stylus")
  , path   = require("path")
  , less   = require("less")

module.exports = function(file, name, url, next) {
  var dirname = path.dirname(name)
    , parser = new less.Parser({ paths: [ dirname, __dirname + "/../../assets/less" ]
                               , filename: name
                               })

  try {
    parser.parse(file.toString(), function(err, tree) {
      if(err) {
        next(err)
      }
      if(process.env.NODE_ENV.toLowerCase() === "production") {
        next(null, tree.toCSS({ compress: true }))
      } else {
        next(null, tree.toCSS({ compress: false }))
      }
    })
  } catch(err) {
    next(err)
  }
} 
