const carbon = require('carbon-io')
const __ = carbon.fibers.__(module)
const _o = carbon.bond._o(module)
const o = carbon.atom.o(module).main // Note the .main here since this is the main application

/***************************************************************************************************
 * HelloService
 *
 * Hello-world example.
 */
__(function() {
  module.exports = o({

    /***************************************************************************
     * _type
     */
    _type: carbon.carbond.Service,

    /***************************************************************************
     * description
     */
    description: "Advanced hello-world service demonstrating custom authenticator",

    /***************************************************************************
     * environmentVariables
     */
    environmentVariables: {
      MONGODB_URI: {
        help: "MongoDB connection string URI",
        required: false
      }
    },

    /***************************************************************************
     * port
     */
    port: 8888,

    /***************************************************************************
     * dbUri
     */
    dbUri: _o('env:MONGODB_URI') || "mongodb://localhost:27017/hello-world",

    /***************************************************************************
     * authenticator
     */
    authenticator: o({
      _type: _o('./JWTAuthenticator'),
      secret: "mySecret"
    }),

    /***************************************************************************
     * message
     */
    message: "Hello world!",

    /***************************************************************************
     * endpoints
     */
    endpoints: {
      users: _o('./UsersEndpoint'),
      hello: _o('./HelloEndpoint'),
      authenticate: _o('./AuthenticateEndpoint')
    }
  })
})
