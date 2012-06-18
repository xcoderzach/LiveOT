AssetPipeline
=============

  Smashes, Caches, Slices, & Dices your static assets.

  The asset pipeline is a simple middleware provider that serves static assets.
It has modules for file version caching, compiling things like coffeescript and
stylus or sass, minifying, obfuscating, and appending scripts and stylesheets,
slicing up the AST of javascript files, to remove sensitive code before it's
sent to the client, etc.  And also can send notifications to the client when a
file changes (not implemented). Perhaps in order to dynamically reload stylesheets, scripts, or
html templates.

  The second part is a clientside component which creates a list of script/stylesheet
tags and watches for changes from the server.

Example
=======

```javascript
  //adds all the files in app
  AssetPipe.script()
    .root(__dirname + "../app/")
    .addFiles(__dirname + "../app")
    .process(CompileCoffee)
    .process(SliceSensitiveMethods)
    .process(Modularize)
    .process(Minify)

```
