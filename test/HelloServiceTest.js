const assert = require('assert')
const jwt = require('jsonwebtoken')
const carbon = require('carbon-io')
const __ = carbon.fibers.__(module)
const _o = carbon.bond._o(module)
const o = carbon.atom.o(module).main // Note the .main here since this is the main (test) application

/***************************************************************************************************
 * HelloServiceTest
 */
__(function() {
  module.exports = o({

    /***************************************************************************
     * _type
     */
    _type: carbon.carbond.test.ServiceTest,

    /***************************************************************************
     * name
     */
    name: "HelloServiceTest",

    /***************************************************************************
     * service
     */
    service: _o('../lib/HelloService'),

    /***************************************************************************
     * setup
     */
    setup: function() {
      carbon.carbond.test.ServiceTest.prototype.setup.call(this)
      this.service.db.command({dropDatabase: 1})
    },

    /***************************************************************************
     * teardown
     */
    teardown: function() {
      this.service.db.command({dropDatabase: 1})
      carbon.carbond.test.ServiceTest.prototype.teardown.call(this)
    },

    /***************************************************************************
     * suppressServiceLogging
     */
    suppressServiceLogging: true,

    /***************************************************************************
     * tests
     */
    tests: [
      // Test POST user
      {
        name: 'POST /users bob@jones.com',
        description: 'should return 201',
        reqSpec: {
          url: '/users',
          method: 'POST',
          body: {
            email: 'bob@jones.com',
            password: '1234'
          }
        },
        resSpec: {
          statusCode: 201,
          body: function(body) {
            assert(body.email === 'bob@jones.com')
          }
        }
      },

      // Test POST user
      {
        name: 'POST /users alice@smith.com',
        reqSpec: {
          url: '/users',
          method: 'POST',
          body: {
            email: 'alice@smith.com',
            password: '5678'
          }
        },
        resSpec: {
          statusCode: 201,
          body: function(body) {
            assert(body.email === 'alice@smith.com')
          }
        }
      },

      // Test POST user with same email
      {
        description: 'should return 409',
        reqSpec: {
          url: '/users',
          method: "POST",
          body: {
            email: 'bob@jones.com',
            password: '1234',
          }
        },
        resSpec: {
          statusCode: 409,
          body: {
            code: 409,
            description: 'Conflict',
            message: 'User exists with this email'
          }
        }
      },

      {
        name: 'Authenticate bob@jones.com',
        reqSpec: {
          url: '/authenticate',
          method: 'POST',
          body: {
            email: 'bob@jones.com',
            password: '1234'
          }
        },
        resSpec: {
          statusCode: 200,
          body: function(body, context) {
            assert.deepEqual(body, {
              jwt: jwt.sign({ _id: context.httpHistory.getRes(0).body._id }, 'mySecret')
            })
          }
        }
      },

      // Test GET user with correct credentials
      {
        name: 'GET /users/:_id',
        reqSpec: function(context) { // We need the previous response to get the _id
          return {
            url: context.httpHistory.getRes('POST /users bob@jones.com').headers.location,
            method: 'GET',
            headers: {
              Authorization: 'Bearer ' + context.httpHistory.getRes('Authenticate bob@jones.com').body.jwt
            }
          }
        },
        resSpec: {
          statusCode: 200,
          body: function(body, context) {
            assert.deepEqual(body, context.httpHistory.getRes('POST /users bob@jones.com').body)
          }
        }
      },

      // Test GET user with wrong credentials
      {
        name: 'GET /users/:_id',
        description: 'Should return 403',
        reqSpec: function(context) { // We need the previous response to get the _id
          return {
            url: context.httpHistory.getRes('POST /users bob@jones.com').headers.location,
            method: 'GET',
            headers: {
              Authorization: 'Bearer ' + authorizationHeader('wrongID')
            }
          }
        },
        resSpec: {
          statusCode: 403,
          body: {
            code: 403,
            description: 'Forbidden',
            message: 'User does not have permission to perform operation'
          }
        }
      },

      // Test PATCH user
      {
        name: 'PATCH /users/:_id',
        reqSpec: function(context) { // We need the previous response to get the _id
          return {
            url: context.httpHistory.getRes('POST /users bob@jones.com').headers.location,
            method: 'PATCH',
            body: {
              password: 'abcd'
            },
            headers: {
              Authorization: 'Bearer ' + context.httpHistory.getRes('Authenticate bob@jones.com').body.jwt
            }
          }
        },
        resSpec: {
          statusCode: 200,
          body: { n: 1 }
        }
      },

      {
        name: 'GET /hello with correct creds',
        reqSpec: function(context) {
          return {
            url: '/hello',
            method: "GET",
            headers: {
              Authorization: 'Bearer ' + context.httpHistory.getRes('Authenticate bob@jones.com').body.jwt
            }
          }
        },
        resSpec: {
          statusCode: 200,
          body: { msg: "Hello world!" }
        }
      },

      {
        name: 'GET /hello with incorrectly signed JWT',
        reqSpec: function(context) {
          return {
            url: '/hello',
            method: "GET",
            headers: {
              Authorization: 'Bearer ' + authorizationHeader(context.httpHistory.getRes(0).body._id, 'wrongSecret')
            }
          }
        },
        resSpec: {
          statusCode: 401,
          body: {
            code: 401,
            description: 'Unauthorized',
            message: 'JsonWebTokenError: invalid signature'
          }
        }
      },

      {
        name: 'GET /hello with malformed Auth header',
        reqSpec: function(context) {
          return {
            url: '/hello',
            method: "GET",
            headers: {
              Authorization: 'Basic malformed header'
            }
          }
        },
        resSpec: {
          statusCode: 401,
          body: {
            code: 401,
            description: 'Unauthorized',
            message: 'Invalid Authorization Header'
          }
        }
      },

      {
        name: 'GET /hello with correctly signed JWT with wrong creds',
        reqSpec: function(context) {
          return {
            url: '/hello',
            method: "GET",
            headers: {
              Authorization: 'Bearer ' + authorizationHeader('wrongID')
            }
          }
        },
        resSpec: {
          statusCode: 403,
          body: {
            code: 403,
            description: 'Forbidden',
            message: 'User does not have permission to perform operation'
          }
        }
      },

      // Test DELETE user
      {
        name: 'DELETE /users/:_id',
        reqSpec: function(context) { // We need the previous response to get the _id
          return {
            url: context.httpHistory.getRes('POST /users bob@jones.com').headers.location,
            method: 'DELETE',
            headers: {
              Authorization: 'Bearer ' + context.httpHistory.getRes('Authenticate bob@jones.com').body.jwt
            }
          }
        },
        resSpec: {
          statusCode: 200,
          body: { n: 1 }
        }
      }

    ]
  })
})

/***************************************************************************************************
 * authorizationHeader()
 */
function authorizationHeader(_id, secret = 'mySecret') {
  return jwt.sign({ _id: _id }, secret)
}
