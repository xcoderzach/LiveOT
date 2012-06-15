var sax = require("sax/lib/sax")

var apply = module.exports.apply = function(doc, seq) {
  var newDoc = []
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

var stringifySequence = module.exports.stringifySequence = function(seq) {
  return seq.map(function(component) {
    return component.character || component.tag
  }).join("")
}

var getSequenceFromXML = module.exports.getSequenceFromXML = function(xml, callback) {
  if(xml === "") {
    return callback([])
  }
  var parser = sax.parser(false)
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
  if(!item1 || !item2)  return false
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

  while(seq1[prefix] && seq2[prefix] && compare(seq1[prefix], seq2[prefix])) {
    diff.push({type: "retain"})
    prefix++
  }
  while(seq1.length && seq2.length && compare(seq1[seq1.length - suffix - 1], seq2[seq2.length - suffix - 1])
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
    if(o.type === "delete") {
      o.clientIds = [clientId]
    } else {
      o.clientId = clientId
    }
  })
  return diff
}

var transform = module.exports.transform = function(s1, s2) {
  var newSeq = [] //seq2'
    , seq1 = s1.slice(0)
    , seq2 = s2.slice(0)

  while(seq1.length && seq2.length) {
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
      if(op1.clientId < op2.clientId) {
        newSeq.push({ type: "retain" })
        newSeq.push(op2)
      } else {
        newSeq.push(op2)
        newSeq.push({ type: "retain" })
      }
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "delete" && op2.type === "delete") {
      seq1.shift()
      seq2.shift()
    }
  }
  ;[].push.apply(newSeq, seq2)
  return newSeq
}

var merge = module.exports.merge = function(seq1, seq2) {
  var i = 0
    , newSeq = [] //seq2'
  seq1 = seq1.slice(0)
  seq2 = seq2.slice(0)

  while(seq1.length && seq2.length) {
    var op1 = seq1[0]
    var op2 = seq2[0]

    if(op1.type === "retain" && op2.type === "retain") {
      newSeq.push(op2)
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "insert" && op2.type === "delete") {
      newSeq.push(op1)
      seq1.shift()
    } else if(op1.type === "delete" && op2.type === "insert") {
      newSeq.push(op2)
      seq2.shift()
    } else if(op1.type === "retain" && op2.type === "delete") {
      newSeq.push(op2)
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "delete" && op2.type === "retain") {
      newSeq.push(op1)
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "retain" && op2.type === "insert") {
      newSeq.push(op2)
      seq2.shift()
    } else if(op1.type === "insert" && op2.type === "retain") {
      newSeq.push(op1)
      seq1.shift()
    } else if(op1.type === "insert" && op2.type === "insert") {
      if(op1.clientId < op2.clientId) {
        newSeq.push(op1)
        newSeq.push(op2)
      } else {
        newSeq.push(op2)
        newSeq.push(op1)
      }
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "delete" && op2.type === "delete") {
      op1.clientIds = op1.clientIds.concat(op2.clientIds)
      newSeq.push(op1)
      seq1.shift()
      seq2.shift()
    }
  }
  ;[].push.apply(newSeq, seq1)
  ;[].push.apply(newSeq, seq2)  

  return newSeq
}

var removeOwnOperations = module.exports.removeOwnOperations = function(seq, clientId) {
  var newSeq = []
  for(var i = 0 ; i < seq.length ; i++) {
    if(seq[i].type === "retain" 
    || seq[i].clientId && seq[i].clientId !== clientId
    || seq[i].clientIds && seq[i].clientIds.indexOf(clientId) === -1) {
      newSeq.push(seq[i])
    } else if(seq[i].type === "insert") {
      newSeq.push({type: "retain"})
    }
  }
  return newSeq
}
