# Hello Service (With Custom Authentication)

[![Build Status](https://img.shields.io/travis/carbon-io-examples/example__hello-world-custom-auth.svg?style=flat-square)](https://travis-ci.org/carbon-io-examples/example__hello-world-custom-auth) ![Carbon Version](https://img.shields.io/badge/carbon--io-0.7-blue.svg?style=flat-square)

In this example we show usage of custom authentication by subclassing the `Authenticator` class. We implement a custom `authenticate` method which
checks for the presence of a valid JSON Web Token (JWT). Let's take a look at how the Service is structured:

- `lib/HelloService.js`: Defines the basic Service
- `lib/UsersEndpoint.js`: Defines the collection for managing users. Creating new users does not require authentication.
- `lib/HelloEndpoint.js`: Defines a `GET` method for the `/hello` path. This simply returns "Hello World". It requires authentication.
- `lib/AuthenticateEndpoint.js`: Defines a `POST` method for `/authenticate` endpoint. Returns a JWT when it receives a valid email and password.
- `lib/JWTAuthenticator.js`: Defines the custom authenticator. Checks for a valid JWT.

**Authentication**

This service has an `authenticator` defined that authenticates users based on a JSON Web Token.

```js
o({
  _type: _o('./JWTAuthenticator'),
  secret: "mySecret"
}),
```

This authenticator ensures that a JWT is presented for each request to the service and that the
supplied JWT key matches a user in the system. The authenticated user is then attached to the `request`
object as a field called `user` so that it may be used by the request downstream.

**Making a Custom Authenticator**

The custom authenticator is defined in `lib/JWTAuthenticator`. It is a subclass of `carbon.carbond.security.Authenticator`. When creating a custom authenticator, you must define the `authenticate` method. This method takes in the request object and should return a user object or undefined.

```js
module.exports = oo({

  /***************************************************************************
  * _type
  */
  _type: carbon.carbond.security.Authenticator,

  _C: function() {

    /*************************************************************************
    * secret
    */
    this.secret = null
  },

  /***************************************************************************
  * authenticate
  */
  authenticate: function(req) {
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
          throw new this.service.errors.Unauthorized(`${e.name}: ${e.message}`)
        }

      } else {
        throw new this.service.errors.Unauthorized('Invalid Authorization Header')
      }

    } else {
      throw new this.service.errors.Unauthorized('No Authorization Header')
    }
  }

})
```

**Access Control**

Once we have authenticated users, we can then use access control lists (ACLs) to control what operations users can perform.

The `hello` endpoint defines an ACL that lets any user access it as long as they are authenticated.

```js
o({
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
})
```

## Installing the service

We encourage you to clone the git repository so you can play around with the code.

```
$ git clone -b carbon-0.7 git@github.com:carbon-io-examples/example__hello-world-custom-auth.git
$ cd example__hello-world-custom-auth
$ npm install
```

## Setting up your environment

This example expects a running MongoDB database. The code will honor a `MONGODB_URI` environment variable. The default URI is `mongodb://localhost:27017/hello-world`.

To set the environment variable to point the app at a database different from the default (on Mac):

```
$ export MONGODB_URI=mongodb://localhost:27017/mydb
```

## Running the service

To run the service:

```sh
$ node lib/HelloService
```

For cmdline help:

```sh
$ node lib/HelloService -h
```

## Accessing the service

You can interact with the service via HTTP. To test authentication and access control, you'll need to first POST a new user to the service. Here is an example using curl:

```
$ curl localhost:8888/users -H "Content-Type: application/json" -d '{"email": "foo@bar.com", "password": "baz"}'
```

Once you have a user, you can request a JWT using

```
$ curl localhost:8888/authenticate -H "Content-Type: application/json" -d '{"email": "foo@bar.com", "password": "baz"}'
```

This should return a JWT which will look similar to this:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OWU1MGRmNTg2ZDRhODQwZjA1ODU3ZTAiLCJpYXQiOjE1MDgxODM1NjJ9.x3rTX9Z6pWlEeFiKWILaeBSyJISsOTxofOp1ytqE-Rk
```

You can now access the `/hello` route using the JWT you received:

```
$ curl localhost:8888/hello -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OWU1MGRmNTg2ZDRhODQwZjA1ODU3ZTAiLCJpYXQiOjE1MDgxODM1NjJ9.x3rTX9Z6pWlEeFiKWILaeBSyJISsOTxofOp1ytqE-Rk"
```

## Running the unit tests

This example comes with a simple unit test written in Carbon.io's test framework called TestTube. It is located in the `test` directory.

```
$ node test/HelloServiceTest
```

or

```
$ npm test
```

## Generating API documentation (aglio flavor)

To generate documentation using aglio, install it as a devDependency:

```
$ npm install -D --no-optional aglio
```

Using `--no-optional` speeds up aglio's install time significantly. Then generate the docs using this command:

```sh
$ node lib/HelloService gen-static-docs --flavor aglio --out docs/index.html
```

* [View current documentation](
http://htmlpreview.github.io/?https://raw.githubusercontent.com/carbon-io-examples/example__hello-world-custom-auth/tree/carbon-0.7/docs/index.html)
