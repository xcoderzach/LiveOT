var uglify = require("uglify-js")
  , traverse = require("traverse")
  , crypto = require("crypto")

module.exports = function(file, name, url, next) {
  var ast
    , newCode

  ast = uglify.parser.parse(file.toString())

  traverse(ast).forEach(function(node) {
    var fnStr
      , hash
      , newValue

    if(!  this.isRoot
       // if the parent node is a function call 
       && this.parent.node[0] === "call"
       // and the current node is the arguments list 
       && this.parent.node[2] === node
       //and the name of the function being called is server 
       && this.parent.node[1][this.parent.node[1].length - 1].match(/^server/)) {
      //THEN WE MANGLE THE AST w000000t!
      newValue = []        
      for (var i = 0; i < node.length; i++) {
        fnStr = uglify.uglify.gen_code(node[i], { indent_level: 2, beautify: true })
        //md5 the function, for rpc
        hash = crypto.createHash("md5")
                     .update(fnStr)
                     .digest("hex")

        newValue[i] = ["string", hash]
      }
      this.update(newValue)
    }
  })
  newCode = uglify.uglify.gen_code(ast, { indent_level: 2, beautify: true })
  next(null, newCode)
}
