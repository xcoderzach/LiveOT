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
    //TODO check for &amp; type entities and make them a single component, so they
    //dont get sliced and diced by xform or merge
    seq = seq.concat(text.split('').map(function(character) {
      return { type: "character", character: character }
    }))
  }

  parser.onopentag = function(node) {
    var tag = "<" + node.name.toLowerCase()
    for (var i in node.attributes) {
      tag += " " + i.toLowerCase() + '="' + node.attributes[i] + '"'
    }
    tag += ">"
    seq.push({type: "open", tag: tag, tagType: node.name })
  }

  parser.onclosetag = function(name) {
    var tag = "</" + name.toLowerCase() + ">"
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

function getOp(operation, component) {
  if(component.type === "open") {
    return { type: operation, tag: component.tag, tagType: component.tagType, open: true }
  } else if(component.type === "close") {
    return { type: operation, tag: component.tag, tagType: component.tagType, open: false }
  }
  return { type: operation, character: component.character }
}
 
function getLevenshteinOperations(oldStr, newStr) {
  var distanceMatrix = []
    , ins, del, sub, minOp, i, j

  for(i = 0 ; i <= oldStr.length ; i++) {
    if(i > 0) {
      distanceMatrix[i] = [{ dist: i, ops: distanceMatrix[i - 1][0].ops.concat(getOp("delete", oldStr[i - 1])) }]
    } else {
      distanceMatrix[i] = [{ dist: i, ops: [] }]
    }
  }
  for(j = 0 ; j <= newStr.length ; j++) {
    if(j > 0) {
      distanceMatrix[0][j] = { dist: j, ops: distanceMatrix[0][j - 1].ops.concat(getOp("insert", newStr[j - 1])) }
    } else {
      distanceMatrix[0][j] = { dist: j, ops: [] }
    }
  }

  for(i = 1 ; i <= oldStr.length ; i++) {
    for(j = 1 ; j <= newStr.length ; j++) {
      distanceMatrix[i][j] = {}
      del = distanceMatrix[i - 1][j]
      ins = distanceMatrix[i][j - 1]
      sub = distanceMatrix[i - 1][j - 1]
      minOp = Math.min(del.dist, sub.dist, ins.dist)
      //TODO use compare()
      if(typeof oldStr[i - 1].character !== "undefined" && oldStr[i - 1].character === newStr[j - 1].character
      || typeof oldStr[i - 1].tag !== "undefined" && oldStr[i - 1].tag === newStr[j - 1].tag) {
        distanceMatrix[i][j].dist = sub.dist
        distanceMatrix[i][j].ops = sub.ops.concat({ type: "retain" })
      } else if(minOp === del.dist) {
        distanceMatrix[i][j].dist = del.dist + 1
        distanceMatrix[i][j].ops = del.ops.concat(getOp("delete", oldStr[i - 1]))
      } else if(minOp === ins.dist) {
        distanceMatrix[i][j].dist = ins.dist + 1
        distanceMatrix[i][j].ops = ins.ops.concat(getOp("insert", newStr[j - 1]))
      } else if(minOp === sub.dist) {
        distanceMatrix[i][j].dist = sub.dist + 1
        distanceMatrix[i][j].ops = sub.ops.concat(getOp("delete", oldStr[i - 1]), getOp("insert", newStr[j - 1]))
      }
    }
  }
  return distanceMatrix[i-1][j-1].ops
}

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
  diff = diff.concat(getLevenshteinOperations(seq1.slice(prefix, -suffix || undefined), seq2.slice(prefix, -suffix || undefined)))
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
  for(var i = 0 ; i < seq1.length ; i++) {
    if(seq1[i].type !== "delete") {
      newSeq.push({ type: "retain" }) 
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

  var tagStack = []
    , tagsToClose = []

  function closeMismatchTags(op) {
    var tag
    while(op.clientId !== (tag = tagStack.pop()).clientId && tag) {
      tagsToClose.push(tag)
      //clientId of -1 means op generated by the server
      newSeq.push({ type: "insert", clientId: -1, tag: "</" + tag.tagType.toLowerCase() + ">", tagType: tag.tagType, open: false })
    }
  }

  function reopenMismatchTags() {
    var tag
    while(tag = tagsToClose.pop()) {
      newSeq.push(tag)
    }
  }

  function handleInsert(op) {
    if(op.open === true) {
      tagStack.push(op)
    } 
    if(op.open === false) {
      closeMismatchTags(op)
    }
    newSeq.push(op)
    if(op.open === false) {
      reopenMismatchTags()
    } 
  }

  while(seq1.length && seq2.length) {
    var op1 = seq1[0]
    var op2 = seq2[0]

    if(op1.type === "retain" && op2.type === "retain") {
      newSeq.push(op2)
      seq1.shift()
      seq2.shift()
    } else if(op1.type === "insert" && op2.type === "delete") {
      handleInsert(op1)
      seq1.shift()
    } else if(op1.type === "delete" && op2.type === "insert") {
      handleInsert(op2)
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
      handleInsert(op2)
      seq2.shift()
    } else if(op1.type === "insert" && op2.type === "retain") {
      handleInsert(op1)
      seq1.shift()
    } else if(op1.type === "insert" && op2.type === "insert") {
      if(op1.clientId < op2.clientId) {
        handleInsert(op1)
        handleInsert(op2)
      } else {
        handleInsert(op2)
        handleInsert(op1)
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
  newSeq = newSeq.concat(seq1)
  newSeq = newSeq.concat(seq2)

  return newSeq
}

var removeOwnOperations = module.exports.removeOwnOperations = function(seq, clientId) {
  var newSeq = []
  for(var i = 0 ; i < seq.length ; i++) {
    if(seq[i].type === "retain" 
    || typeof seq[i].clientId !== "undefined" && seq[i].clientId !== clientId
    || typeof seq[i].clientIds !== "undefined" && seq[i].clientIds.indexOf(clientId) === -1) {
      newSeq.push(seq[i])
    } else if(seq[i].type === "insert") {
      newSeq.push({type: "retain"})
    }
  }
  return newSeq
}
