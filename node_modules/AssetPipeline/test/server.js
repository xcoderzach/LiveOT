var fs = require("fs")
  , request = require("superagent")
  , connect = require("connect")
  , server
  , testPipe = require("./pipes/test_pipe.js")

server = connect(testPipe.server.middleware())
server.listen(3003)

describe("AssetServer", function() { 
  it("should serve the test file", function(done) {
    request.get('localhost:3001/modules/models/user.js', function(res) {
      res.headers['content-type'].should.equal("application/javascript")
      res.text.should.equal(fs.readFileSync(__dirname + "/output/user_javascript_output.js", "utf8"))
      done()
    })
  })
})
