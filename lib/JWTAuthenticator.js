const carbon = require('carbon-io')
const o = carbon.atom.o(module)
const oo = carbon.atom.oo(module)
const jwt = require('jsonwebtoken');

/***************************************************************************************************
 * JWTAuthenticator
 *
 * Extends the Authenticator class and defines its own authenticate function to verify JSON web
 * tokens.
 */
class JWTAuthenticator extends carbon.carbond.security.Authenticator {

  constructor() {
    super()

    /*************************************************************************
    * secret
    */
    this.secret = null
  }

  /***************************************************************************
  * authenticate
  */
  authenticate(req) {
    // Check the Authorization header is present
    if (req.headers && req.headers.authorization) {
      let parts = req.headers.authorization.split(' ');

      // Check the Authorization Header is well formed
      if (parts.length === 2 && parts[0] === 'Bearer') {
        let token = parts[1];

        try {
          // verify JWT and find user in database
          let jwtbody = jwt.verify(token, this.secret)
          let user = this.service.db.getCollection('users').findOne({ _id: jwtbody._id })
          return user
        } catch (e) {
          this.throwUnauthenticated(`${e.name}: ${e.message}`)
        }

      } else {
        this.throwUnauthenticated('Invalid Authorization Header')
      }

    } else {
      this.throwUnauthenticated('No Authorization Header')
    }
  }

}

module.exports = JWTAuthenticator
