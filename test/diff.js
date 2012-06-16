ot = require("../transform")

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

describe("when I fuzz test", function() {
  it("it should maintain admissibility and not die", function(done) {

    for(var i = 0, j = 0 ; i < 5000 ; i++) {
      var str1 = Math.random().toString(36).substr(2,7)
        , str2 = randomOps(str1)
        , str3 = randomOps(str1)

      ot.getSequenceFromXML(str1, function(seq) {
        ot.getSequenceFromXML(str2, function(seq1) {
          ot.getSequenceFromXML(str3, function(seq2) {
            var diff1 = ot.getDiffOperations(seq, seq1, 1)
            var diff2 = ot.getDiffOperations(seq, seq2, 2)

            var res1 = ot.apply(seq, diff1)
            var res2 = ot.apply(res1, ot.transform(diff1, diff2))

            var res3 = ot.apply(seq, diff2)
            var res4 = ot.apply(res3, ot.transform(diff2, diff1))

            ot.stringifySequence(res2).should.equal(ot.stringifySequence(res4))

            if(++j === 5000) {
              done()
            }
          })
        })
      })
    } 
  })
  it("it should converge when applying extracted remotes", function(done) {
    for(var i = 0, j = 0 ; i < 5000 ; i++) {
      var str1 = Math.random().toString(36).substr(2,7)
        , str2 = randomOps(str1)
        , str3 = randomOps(str1)
                                
      ot.getSequenceFromXML(str1, function(seq) {
        ot.getSequenceFromXML(str2, function(seq1) {
          ot.getSequenceFromXML(str3, function(seq2) {
            var diff1 = ot.getDiffOperations(seq, seq1, 1)
            var diff2 = ot.getDiffOperations(seq, seq2, 2)
            
            var merged = ot.merge(diff2, diff1)

            var extracted1 = ot.removeOwnOperations(merged, 1)
            var extracted2 = ot.removeOwnOperations(merged, 2)

            var c1str = ot.stringifySequence(ot.apply(seq1, extracted1)) 
            var c2str = ot.stringifySequence(ot.apply(seq2, extracted2)) 

            var mergeStr = ot.stringifySequence(ot.apply(seq, merged))

            c2str.should.equal(c1str)
            c1str.should.equal(mergeStr)

            if(++j === 5000) {
              done()
            }
          })
        })
      })
    } 
  })
  it("should generate valid markup when merging", function() {
      ot.getSequenceFromXML("italic both bold", function(seq) {
        ot.getSequenceFromXML("<i>italic both</i> bold", function(seq1) {
          ot.getSequenceFromXML("italic <strong>both bold</strong>", function(seq2) {
            var diff1 = ot.getDiffOperations(seq, seq1, 1)
            var diff2 = ot.getDiffOperations(seq, seq2, 2)

            var merged = ot.merge(diff1, diff2)

            var mergeStr = ot.stringifySequence(ot.apply(seq, merged))
            mergeStr.should.equal("<i>italic <strong>both</strong></i><strong> bold</strong>")
          })
        })
      })
  }) 
})
