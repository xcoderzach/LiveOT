var sax = require("sax")

function apply(doc, seq) {
  var newDoc = []
    , tagStack = []
  for(var i = 0, j = 0 ; i < seq.length ; i++) {
    var op = seq[i]
    if(op.type === "retain") {
      newDoc.push(doc[j])
      j++
    } else if(op.type === "insert") {
      newDoc.push(op.character)
    } else if(op.type === "delete") {
      if(doc[j] !== op.character) {
        throw new Error("Delete operation deleting wrong character. Expected: " + op.character + " got: " + doc[j])
      }
      j++
    } else if(op.type === "insertOpenTag") {
      tagStack.push(op.tagType)
      console.log(tagStack)
      newDoc.push(op.tag)
    } else if(op.type === "insertCloseTag") {
      var tag = tagStack.pop()
      if(tag !== op.tagType) {
        console.log(newDoc)
        throw new Error("Closing wrong tag type. Expected: " + op.tagType + " got: " + tag)
      }
      newDoc.push(op.tag)
    } else if(op.type === "deleteCloseTag" || op.type === "deleteOpenTag") {
      if(doc[j] !== op.tag) {
        throw new Error("Delete operation deleting wrong tag. Expected: " + op.tag + " got: " + doc[j])
      }
      j++
    } 
  }
  return newDoc
}


function getSequenceFromXML(xml, callback) {
  var parser = sax.parser(true)
    , seq = []

  parser.ontext = function(text) {
    [].push.apply(seq, text.split(''))
  }

  parser.onopentag = function(node) {
    var tag = "<" + node.name
    for (var i in tag.attributes) {
      tag += " " + i + ' = "' + entity(tag.attributes[i]) + '"'
    }
    tag += ">"
    seq.push(tag)
  }

  parser.onclosetag = function(name) {
    var tag = "</" + name + ">"
    seq.push(tag)
  }

  parser.onend = function() {
    callback(seq)
  }

  parser.write(xml).close()
}

getSequenceFromXML("<xml>herp<stuff></stuff></xml>", function(seq) {
  console.log(seq)
  console.log(apply(seq
      , [ {type: "deleteOpenTag", tag: "<xml>"}
        , {type: "retain"}
        , {type: "retain"}
        , {type: "retain"}
        , {type: "retain"}
        , {type: "insertOpenTag", tag: "<herp>", tagType: "herp"}
        , {type: "retain"}
        , {type: "retain"}
        , {type: "insertCloseTag", tag: "</herp>", tagType: "herp"}
        , {type: "deleteCloseTag", tag: "</xml>" } ]))

})
