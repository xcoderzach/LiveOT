var _ = require("underscore")
module.exports.asyncEach = function(coll, fn, end) {
  var type
    , obj
    , end = end || function() {}

  if(typeof coll === "object" && !_.isArray(coll)) {
    obj = coll
    coll = _.keys(coll)
    type = "object"
  }
  var callNext = function(i) {
    if(i < coll.length) {
      if(type == "object") {
        fn(obj[coll[i]], coll[i], function() {
          callNext(i+1)
        })
      } else {
        fn(coll[i], function() {
          callNext(i+1)
        })
      }
    } else {
      end()
    }
  }
  if(coll && coll.length) {
    callNext(0) 
  } else {
    end()
  }
}
 
