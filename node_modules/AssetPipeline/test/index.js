var AssetPipe = require("../lib/index")
  , path = require("path")
  , fs = require("fs")
  , scriptPipe

describe("AssetPipeline", function() {
  describe(".script()", function() {
    describe("with no middleware", function() {

      before(function() {
        var assetPipe = new AssetPipe()

        scriptPipe = assetPipe.script()
          .root(__dirname + "/scripts")
          .addFiles(__dirname + "/scripts/")
      })
      describe(".get()", function() {
        it("should output the files", function(done) {
          var script = scriptPipe.get("/modules/derp.js", function(err, script) {
            script.toString().should.equal("derp()\n")
            done()
          })
        })
      })
      describe(".getScriptTags()", function() {
        it("should output the files", function() {
          var tags = scriptPipe.getScriptTags()
          tags.should.eql(fs.readFileSync(__dirname + "/output/script_tags.html", "utf8"))
        })
      })
    })
    describe("with middleware", function() {
      before(function() {
        var assetPipe = new AssetPipe()

        scriptPipe = assetPipe.script()
          .root(__dirname + "/scripts")
          .addFiles(__dirname + "/scripts")
          .process(function(file, name, url, next) {
             next(null, "(function() {\n" + file.toString() + "}())\n") 
          })
      }) 
      describe(".get()", function() {
        it("the file should be wrapped", function(done) {
          var script = scriptPipe.get("/modules/derp.js", function(err, script) {
            script.should.equal(fs.readFileSync(__dirname + "/output/wrapped.js", "utf8"))
            done()
          })
        })
      })
    })
  })
})
