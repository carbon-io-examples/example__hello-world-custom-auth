const carbon = require('carbon-io')
const o = carbon.atom.o(module)
const _o = carbon.bond._o(module)

/***************************************************************************************************
 * HelloEndpoint
 *
 * This is the /hello Endpoint. It returns "Hello World" to a GET request as long as the user is
 * authenticated.
 */
module.exports = o({
  _type: carbon.carbond.Endpoint,

  /***********************************************************************
   * acl
   *
   * All users can access the /hello endpoint if they are authenticated
   */
  acl: o({
    _type: carbon.carbond.security.EndpointAcl,

    entries: [
      {
        // All users
        user: '*',
        permissions: {
          '*': true
        }
      }
    ]
  }),

  /***********************************************************************
   * get
   *
   * Returns 'Hello World'
   */
  get: {
    responses: [
      {
        statusCode: 200,
        description: "Success",
        schema: {
          type: 'object',
          properties: {
            msg: { type: 'string' }
          },
          required: [ 'msg' ],
          additionalProperties: false
        }
      }
    ],

    service: function(req, res) {
      return { msg: 'Hello world!' }
    }
  },
})
