var stylus = require("stylus")
  , nib    = require("nib")
  , path   = require("path")


module.exports = function(file, name, url, next) {
  var dirname = path.dirname(name)
  stylus(file.toString())
    .set('paths', [dirname, require('stylus-blueprint')])
    .use(nib())
    .render(function(err, css) {
      if(err) {
        next(err)
      } else {
        next(null, css)
      }
    })
}
