# Hello Service (With Custom Authentication)

In this example we show usage of custom authentication by subclassing the `Authenticator` class. We implement

The code defining the service is located in `lib/HelloService.js` and uses a simple `Endpoint` object
to implement an HTTP `GET` at the path `/hello`.

**Authentication**

This service has an `authenticator` defined that authenticates users based on a JSON Web Token.

```js
o({
  _type: _o('./JWTAuthenticator'),
  secret: "mySecret"
}),
```

This authenticator ensures that an API key is presented for each request to the service and that the
supplied API key matches a user in the system. The authenticated user is then attached to the `request`
object as a field called `user` so that it may be used by the request downstream.

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
$ git clone git@github.com:carbon-io-guides/example__hello-world-service-http-basic-auth.git
$ cd example__hello-world-service-http-basic-auth
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

Once you have a user, you can test using:

```
$ curl -u foo@bar.com:baz localhost:8888/hello
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

```sh
$ node lib/HelloService gen-static-docs --flavor aglio --out docs/index.html
```

* [View current documentation](
http://htmlpreview.github.io/?https://raw.githubusercontent.com/carbon-io-guides/example__hello-world-service-http-basic-auth/master/docs/index.html)
