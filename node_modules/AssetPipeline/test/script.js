var AssetPipe = require("../lib/index")
  , path = require("path")
  , fs = require("fs")
  , request = require("superagent")
  , connect = require("connect")
  , server
  , testPipe = require("./pipes/test_pipe.js")

server = connect(testPipe.server.middleware())
server.listen(3001)

describe("AssetPipeline", function() {
  describe("loading a stylesheet", function() {
    it("should convert the .coffee to .js", function(done) {
      request.get('localhost:3001/modules/test.js', function(res) {
        res.headers['content-type'].should.equal("application/javascript")
        res.text.should.equal(fs.readFileSync(__dirname + "/output/coffee_out.js", "utf8"))
        done()
      }) 
    })
  })
}) 
