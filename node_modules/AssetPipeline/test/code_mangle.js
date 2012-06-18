var stripCode = require("../lib/processors/strip_code")
  , fs = require("fs")

describe("the strip code processor", function() {
  it("should remove methods that start with server", function(done) {
    stripCode(fs.readFileSync(__dirname + "/scripts/models/server.js", 'utf8'), "server.js", "/js/server.js", function(err, newCode) {
      //add a newline because file has extra \n
      newCode += "\n"
      newCode.should.equal(fs.readFileSync(__dirname + "/output/mangled.js", 'utf8'))
      done()
    })
  })
})
