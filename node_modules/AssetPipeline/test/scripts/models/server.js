module.exports = Document("Server")
  .serverOnlyCode(function() {
    moreSecretStuff()
  })
  .serverBeforeSave(function() {
    doSecretStuff()
  })
