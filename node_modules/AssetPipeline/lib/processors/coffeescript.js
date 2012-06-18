var coffee = require("coffee-script")

module.exports = function(file, name, url, next) {
  var javascript
  try {
    javascript = coffee.compile(file.toString())
    next(null, javascript)
  } catch(e) {
    //send the error to the client so they can see it in clientside dev
    next(null, new Error("syntax error " + url + " " + e.toString()))
  } 
}
