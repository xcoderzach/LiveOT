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
    it("should serve the image", function(done) {
      request.get('localhost:3001/images/test.png', function(res) {
        res.headers['content-type'].should.equal("image/png")
        //not sure how to check that its the right content, it has however
        //been manually verified :-S
        done()
      }) 
    })
  })
}) 
