function apply(doc, seq) {
  var newDoc = ""
  for(var i = 0, j = 0 ; i < seq.length ; i++) {
    var op = seq[i]
    if(op.type === "retain") {
      newDoc += doc[j] 
      j++
    } else if(op.type === "insert") {
      newDoc += op.character
    } else if(op.type === "delete") {
      if(doc[j] !== op.character) {
        throw new Error("Delete operation deleting wrong character. Expected: " + op.character + " got: " + doc[j])
      }
      j++
    }
  }
  return newDoc
}

module.exports.transform = function() {

}
