var sax = require("sax")

var apply = module.exports.apply = function(doc, seq) {
  var newDoc = []
    , tagStack = []
  for(var i = 0, j = 0 ; i < seq.length ; i++) {
    var op = seq[i]
    if(op.type === "retain") {
      newDoc.push(doc[j])
      j++
    } else if(op.type === "insert") {
      if(op.character) {
        newDoc.push({character: op.character, type: "character" })
      } else if(op.tag) {
        newDoc.push({ tag: op.tag, type: "tag" })
      }
    } else if(op.type === "delete") {
      j++
    }
  }
  return newDoc
}

function stringifySequence(seq) {
  return seq.map(function(component) {
    if(component)
    return component.character || component.tag
  }).join("")
}

var getSequenceFromXML = module.exports.getSequenceFromXML = function(xml, callback) {
  var parser = sax.parser(true)
    , seq = []

  parser.ontext = function(text) {
    ;[].push.apply(seq, text.split('').map(function(character) {
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
var getDiffOperations = module.exports.getDiffOperations = function(seq1, seq2, clientId) {
  var prefix = 0
    , suffix = 0
    , diff = []
    , i = 0

  while(seq1[prefix] && seq2[prefix] &&compare(seq1[prefix], seq2[prefix])) {
    diff.push({type: "retain"})
    prefix++
  }
  while(compare(seq1[seq1.length - suffix - 1], seq2[seq2.length - suffix - 1])
     && suffix + prefix < Math.min(seq1.length, seq2.length)) { 
    suffix++
  }
  for(i = prefix ; i < seq1.length - suffix ; i++) {
    if(seq1[i].type === "open") {
      diff.push({ type: "delete", tag: seq1[i].tag, tagType: seq1[i].tagType })
    } else if(seq1[i].type === "close") {
      diff.push({ type: "delete", tag: seq1[i].tag, tagType: seq1[i].tagType })
    } else if(seq1[i].type === "character") {
      diff.push({ type: "delete", character: seq1[i].character })
    } 
  }
  for(i = prefix ; i < seq2.length - suffix ; i++) {
    if(seq2[i].type === "open") {
      diff.push({ type: "insert", tag: seq2[i].tag, tagType: seq2[i].tagType })
    }
    if(seq2[i].type === "close") {
      diff.push({ type: "insert", tag: seq2[i].tag, tagType: seq2[i].tagType })
    }
    if(seq2[i].type === "character") {
      diff.push({ type: "insert", character: seq2[i].character })
    }
  }
  for(i = 0 ; i < suffix ; i++) {
    diff.push({type: "retain"})
  }
  diff.forEach(function(o) {
    o.clientId = clientId
  })
  return diff
}

var transform = function(seq1, seq2) {
  var i = 0
    , newSeq = [] //seq2'
  seq1 = seq1.slice(0)
  seq2 = seq2.slice(0)

  while(seq1.length || seq2.length) {
    var op1 = seq1[0]
    var op2 = seq2[0]

    if(op1.type === "retain" && op2.type === "retain") {
      newSeq.push(op2)
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "insert" && op2.type === "delete") {
      newSeq.push({ type: "retain" })
      seq1.shift()
    } else if(op1.type === "delete" && op2.type === "insert") {
      newSeq.push(op2)
      seq2.shift()
    } else if(op1.type === "retain" && op2.type === "delete") {
      newSeq.push(op2)
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "delete" && op2.type === "retain") {
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "retain" && op2.type === "insert") {
      newSeq.push(op2)
      seq2.shift()
    } else if(op1.type === "insert" && op2.type === "retain") {
      newSeq.push(op2)
      seq1.shift()
    } else if(op1.type === "insert" && op2.type === "insert") {
      if(op1.character && op2.character && op1.character === op2.character) {
        newSeq.push({ type: "retain" })
      } else {
        if(op1.clientId < op2.clientId) {
          newSeq.push({ type: "retain" })
          newSeq.push(op2)
        } else {
          newSeq.push(op2)
          newSeq.push({ type: "retain" })
        }
      }
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "delete" && op2.type === "delete") {
      seq1.shift()
      seq2.shift()
    }
  }
  return newSeq
}

var merge = function(seq1, seq2) {
  var i = 0
    , newSeq = [] //seq2'
  seq1 = seq1.slice(0)
  seq2 = seq2.slice(0)

  while(seq1.length && seq2.length) {
    var op1 = seq1[0]
    var op2 = seq2[0]

    if(op1.type === "retain" && op2.type === "retain") {
      console.log("rr")
      newSeq.push(op2)
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "insert" && op2.type === "delete") {
      console.log("id")
      newSeq.push(op1)
      seq1.shift()
    } else if(op1.type === "delete" && op2.type === "insert") {
      console.log("di")
      newSeq.push(op2)
      seq2.shift()
    } else if(op1.type === "retain" && op2.type === "delete") {
      console.log("rd")
      newSeq.push(op2)
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "delete" && op2.type === "retain") {
      console.log("dr")
      newSeq.push(op1)
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "retain" && op2.type === "insert") {
      console.log("ri")
      newSeq.push(op2)
      seq2.shift()
    } else if(op1.type === "insert" && op2.type === "retain") {
      console.log("ir")
      newSeq.push(op1)
      seq1.shift()
    } else if(op1.type === "insert" && op2.type === "insert") {
      console.log("ii")
      if(op1.character && op2.character && op1.character === op2.character) {
        newSeq.push(op1)
      } else if(op1.clientId < op2.clientId) {
        newSeq.push(op1)
        newSeq.push(op2)
      } else {
        console.log(op1.character)
        console.log(op2.character)
        newSeq.push(op2)
        newSeq.push(op1)
      }
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "delete" && op2.type === "delete") {
      console.log("dd")
      newSeq.push(op1)
      seq1.shift()
      seq2.shift()
    }
  }
  console.log(seq1.length, seq2.length)
  ;[].push.apply(newSeq, seq1)
  ;[].push.apply(newSeq, seq2)  
  return newSeq
}


function randomOps(str) {
  var randIndex
    , randChar
  for(var i = 0 ; i < 3 ; i++) {
    randIndex = Math.round(Math.random() * str.length)
    randChar = (Math.random()).toString(36).substr(2, 3)[0]
    if(Math.random() > .5) {
      str = str.substr(0, randIndex) + str.substr(randIndex + 1, str.length)
    } else {
      str = str.substr(0, randIndex) + randChar + str.substr(randIndex, str.length)   
    }
  }
  return str
}    

for(var i = 0 ; i < 1000 ; i++) {
  var str1 = "abv"
    , str2 = "n8abv"//randomOps(str1)
    , str3 = "bav"//randomOps(str1)
  console.log(str2, str3)

  getSequenceFromXML("<a>" + str1 + "</a>", function(seq) {
    getSequenceFromXML("<a>" + str2 + "</a>", function(seq1) {
      getSequenceFromXML("<a>" + str3 + "</a>", function(seq2) {
        var diff1 = getDiffOperations(seq, seq1, 1)
        var diff2 = getDiffOperations(seq, seq2, 2)

        var res1 = apply(seq, diff1)
        var res2 = apply(res1, transform(diff1, diff2))

        var res3 = apply(seq, diff2)
        var res4 = apply(res3, transform(diff2, diff1))
        var merged = merge(diff2, diff1)

        console.log(transform(diff2, diff1))
        var mergeStr = stringifySequence(apply(seq, merged))
        console.log(merged, mergeStr)
        console.log(stringifySequence(res2))

        if(stringifySequence(res2) !== mergeStr) {
          throw new Error(stringifySequence(res2) + " " + mergeStr)
        }
      })
    })
  })
}
