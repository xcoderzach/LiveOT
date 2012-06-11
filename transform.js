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
    [].push.apply(seq, text.split('').map(function(character) {
      return { type: "character", character: character }
    }))
  }

  parser.onopentag = function(node) {
    var tag = "<" + node.name
    for (var i in tag.attributes) {
      tag += " " + i + ' = "' + entity(tag.attributes[i]) + '"'
    }
    tag += ">"
    seq.push({type: "open", tag: tag, tagType: node.name })
  }

  parser.onclosetag = function(name) {
    var tag = "</" + name + ">"
    seq.push({type: "close", tag: tag, tagType: name })
  }

  parser.onend = function() {
    callback(seq)
  }

  parser.write(xml).close()
}

function compare(item1, item2) {
  return item1.character && item1.character === item2.character 
      || item1.tag && item1.tag === item2.tag 
}

/**
 * Do this the lazy way, compute the common prefix and the common suffix,
 * then delete everything in between and insert the new stuff
 */
function getDiffOperations(seq1, seq2) {
  var prefix = 0
    , suffix = 0
    , diff = []
    , i = 0

  while(compare(seq1[prefix], seq2[prefix])) {
    diff.push({type: "retain"})
    prefix++
  }
  while(compare(seq1[seq1.length - suffix - 1], seq2[seq2.length - suffix - 1])) { 
    suffix++
  }
  for(i = prefix ; i < seq1.length - suffix ; i++) {
    if(seq1[i].type === "open") {
      diff.push({ type: "deleteOpenTag", tag: seq1[i].tag, tagType: seq1[i].tagType })
    } else if(seq1[i].type === "close") {
      diff.push({ type: "deleteCloseTag", tag: seq1[i].tag, tagType: seq1[i].tagType })
    } else if(seq1[i].type === "character") {
      diff.push({ type: "delete", character: seq1[i].character })
    } 
  }
  for(i = prefix ; i < seq2.length - suffix ; i++) {
    if(seq2[i].type === "open") {
      diff.push({ type: "insertOpenTag", tag: seq2[i].tag, tagType: seq2[i].tagType })
    }
    if(seq2[i].type === "close") {
      diff.push({ type: "insertCloseTag", tag: seq2[i].tag, tagType: seq2[i].tagType })
    }
    if(seq2[i].type === "character") {
      diff.push({ type: "insert", character: seq2[i].character })
    }
  }
  for(i = 0 ; i < suffix ; i++) {
    diff.push({type: "retain"})
  }
  return diff
}

getSequenceFromXML("<xml>herpsdfa</xml>", function(seq1) {
  getSequenceFromXML("<xml>herp<stuff></stuff></xml>", function(seq2) {
    console.log(getDiffOperations(seq1, seq2))
  })
})
