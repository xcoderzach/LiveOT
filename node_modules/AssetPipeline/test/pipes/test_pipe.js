var AssetPipe = require("../../lib/index")
  , ModuleProcessor = require("../../lib/processors/module")
  , StylusProcessor = require("../../lib/processors/stylus") 
  , CoffeeScriptProcessor = require("../../lib/processors/coffeescript") 

module.exports = assetPipe = new AssetPipe()

var scriptPipeline = assetPipe.script()
var coffeeScriptPipeline = assetPipe.script()
var stylesheetPipeline = assetPipe.stylesheet()
var imagePipeline = assetPipe.image()

scriptPipeline
  .root(__dirname + "/../scripts/")
  .addFiles(__dirname + "/../scripts/")
  .process(ModuleProcessor(__dirname + "/.."))

coffeeScriptPipeline
  .fileExtension(".coffee")
  .root(__dirname + "/../scripts/")
  .addFiles(__dirname + "/../scripts/")
  .process(CoffeeScriptProcessor)
  .process(ModuleProcessor(__dirname + "/.."))
 
stylesheetPipeline
  .fileExtension(".styl")
  .urlPrefix("/css") 
  .root(__dirname + "/../stylesheets")
  .addFiles(__dirname + "/../stylesheets/")
  .process(StylusProcessor)

imagePipeline
  .root(__dirname + "/../images")
  .addFiles(__dirname + "/../images")
