const carbon = require('carbon-io')
const o = carbon.atom.o(module)
const _o = carbon.bond._o(module)
const _ = require('lodash')
const jwt =  require('jsonwebtoken')

/***************************************************************************************************
 * AuthenticateEndpoint
 *
 * This is the /authenticate Endpoint. When the user POSTs a valid username and password to this
 * endpoint, they will be granted a JWT.
 */
module.exports = o({

  /***************************************************************************
  * _type
  */
  _type: carbon.carbond.Endpoint,

  /***************************************************************************
  * allowUnauthenticated
  */
  allowUnauthenticated: ['post'],

  /***************************************************************************
  * passwordHasher
  */
  passwordHasher: o({
    _type: carbon.carbond.security.BcryptHasher,
    rounds: 10
  }),

  /***********************************************************************
  * post
  *
  * Returns a JWT token if the user successfully authenticates
  */
  post: {
    responses: [
      {
        statusCode: 200,
        description: "Success",
        schema: {
          type: 'object',
          properties: {
            jwt: { type: 'string' }
          },
          required: [ 'jwt' ],
          additionalProperties: false
        }
      }
    ],

    service: function(req, res) {

      let service = this.getService()

      try {
        // find user by email
        result = service.db.getCollection('users').findOne({ email: req.body.email })
      } catch (e) {
        throw new service.errors.InternalServerError(e.message)
      }

      if (!result) {
        throw new service.errors.NotFound("email: " + req.body.email)
      }

      // If password doesn't match, send a 401 error
      if (!this.endpoint.passwordHasher.eq(req.body.password, result.password)) {
        throw new service.errors.Unauthorized()
      }

      // Otherwise, send a JWT token including the _id of the user
      return { jwt: jwt.sign({ _id: result._id }, service.authenticator.secret) }
    }
  }
})
