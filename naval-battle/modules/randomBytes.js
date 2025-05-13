const crypto = require('crypto');

  function generateHash (key){
    return crypto.randomBytes(key).toString('hex')
}

module.exports= {
    generateHash
}