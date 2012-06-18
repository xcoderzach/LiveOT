AssetPipeline API
=================

##AssetPipe

###script

#####AssetPipe.script()

Returns a new script pipeline.

###image

#####AssetPipe.image()

Returns a new image pipeline.

###stylesheet

#####AssetPipe.stylesheet()

Returns a new stylesheet pipeline.

###html

#####AssetPipe.html()

Returns a new html pipeline.

##Pipeline

###root

#####Pipeline.root(directory)

`root` is the root directory from which the assets will be served. Used to translate URLs to file names.

###fileExtension

#####Pipeline.fileExtension(extension)

`extension` refers to the file extension of the assets which will be served.

```javascript
Pipe
  .fileExtension("coffee")
```
This will serve CoffeeScript files.

###urlExtension

#####Pipeline.urlExtension(extension)

`extension` refers to the file extension on the requested URL.

```javascript
Pipe
  .fileExtension("coffee")
  .urlExtension("js")
  .process(coffee)
```
This will serve CoffeeScript files compiled as JavaScript.

###addFiles

#####Pipeline.addFiles(file)

`file` is a string. If `file` contains a filename, that filename will be served. If it contains a directory name, all files within that directory, and all subdirectories, will be served.

###process

#####Pipeline.process(processor)

`processor` is a function that processes assets accessed through the pipeline in some way. (e.g. processing CoffeeScript to JavaScript or less into css.)

##Processor

There are several built-in processors:

###coffeescript

This processor compiles CoffeeScript into JavaScript.

```javascript
Pipe
  .process(require("AssetPipeline/lib/processors/coffeescript"))
```

###less

This processor parses LESS into CSS. By default, the LESS processor includes bootstrap in its paths, so you can @import any default bootstrap stylesheets.

```javascript
Pipe
  .process(require("AssetPipeline/lib/processors/less"))
```

###stylus

This processor parses Stylus into CSS. It includes stylus-blueprint and nib by default.

```javascript
Pipe
  .process(require("AssetPipeline/lib/processors/stylus"))
```

###module

This processor wraps javascript files in commonjs modules.

```javascript
module = require("AssetPipeline/lib/processors/modules")
Pipe
  .process(module(baseURL, aliases))
```

`baseURL` refers to the root URL from which modules will be requirable.
`aliases` refers to a map of module name aliases.

###strip code

This processor strips arguments out of function calls where the function name begins with `server`.

```javascript
Pipe
  .process(require("AssetPipeline/lib/processors/strip_code"))
```

