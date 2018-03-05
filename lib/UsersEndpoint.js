const carbon = require('carbon-io')
const o = carbon.atom.o(module)
const _o = carbon.bond._o(module)
const _ = require('lodash')

/***************************************************************************************************
 * UsersEndpoint
 *
 * This is the /users Endpoint. It is a Collection.
 */
module.exports = o({

  /*****************************************************************************
   * _type
   */
  _type: carbon.carbond.mongodb.MongoDBCollection,

  /*****************************************************************************
   * enabled
   */
  enabled: {
    insertObject: true,
    findObject: true,
    updateObject: true,
    removeObject: true
  },

  /*****************************************************************************
   * idPathParameter
   *
   * This is how we define the path parameter to be :user in /users/:user
   */
  idPathParameterName: 'user',

  /*****************************************************************************
   * collectionName
   *
   * The name of the MongoDB collection storing Users.
   */
  collectionName: 'users',

  /*****************************************************************************
   * allowUnauthenticated
   *
   * This allows us to create new users without being authenticated
   */
  allowUnauthenticated: ['post'],

  /*****************************************************************************
   * schema
   *
   * This is the schema for User objects handled by this Endpoint. Schema for
   * insertObject and updateObject will differ from this by allowing for a
   * password to be sen to the server.
   */
  schema: {
    type: "object",
    properties: {
      _id: { type: 'string' },
      email: { type: 'string', format: 'email' },
      password: { type: 'string' }
    },
    required: [ '_id', 'email' ],
    additionalProperties: false
  },

  /*****************************************************************************
   * acl
   *
   * This acl ensures that the /users/:user endpoint disallows access unless
   * the authenticated user owns the User.
   */
  acl: o({
    _type: carbon.carbond.security.CollectionAcl,

    entries: [
      {
        // All users
        user: '*',
        permissions: {
          // For all operations, make sure the user id is the same as the authenticated user
          '*': function(user, env) {
            let userId = env.req.parameters['user']
            if (userId) {
              return user._id === userId
            }

            return false // Disallow if there is no userId parameter
          }
        }
      }
    ]
  }),

  /*****************************************************************************
   * insertObjectConfig
   */
  insertObjectConfig: {
    allowUnauthenticated: true, // This operation disables authentication. It is how new users are made.

    // This is the schema for posting to /users. New users post email and password.
    insertObjectSchema: {
      type: "object",
      properties: {
        email: {type: 'string', format: 'email'},
        password: {type: 'string'},
      },
      required: ['email', 'password'],
      additionalProperties: false
    },
    returnsInsertedObject: true
  },

  /*****************************************************************************
   * preInsertObject
   */
  preInsertObject: function(object) {
    let user = {
      _id: object._id, // Since we have an idGenerator an _id will already have been generated for the new obj
      email: object.email,
      password: this.passwordHasher.hash(object.password)
    }

    // Check for existing user. In a real production app you will want a unique index on email.
    let existingUser = this.service.db.getCollection(this.collectionName).findOne({email: object.email})
    if (existingUser) {
      throw new carbon.HttpErrors.Conflict("User exists with this email")
    }

    return {
      object: user
    }
  },

  /*****************************************************************************
   * postInsertObject
   *
   * Return the user without the password
   */
  postInsertObject: function(result) {
    return this.publicUserView(result)
  },

  /*****************************************************************************
   * postFindObject
   *
   * Return the user without the password
   */
  postFindObject: function(result) {
    return this.publicUserView(result, true)
  },

  /*****************************************************************************
   * updateObjectConfig
   *
   * SECURITY: This is secured by virtue of the CollectionAcl defined
   * on this Collection endpoint which ensures this id (/users/:id) is the same as the
   * authenticated User's _id.
   */
  updateObjectConfig: {
    supportsUpsert: false,
    // For security reasons it is important to only allow the user to update some fields.
    updateSchema: {
      type: "object",
      properties: {
        password: { type: 'string' },
        email: { type: 'string', format: 'email' }
      },
      additionalProperties: false
    }
  },

  /*****************************************************************************
   * preUpdateObject
   *
   * SECURITY: This is secured by virtue of the CollectionAcl defined
   * on this Collection endpoint which ensures this id (/users/:id) is the same as the
   * authenticated User's _id.
   */
  preUpdateObject: function(id, update) {
    let updateObj = {}

    // If password is being reset, hash it like we did when we inserted.
    if (update.password) {
      updateObj.password = this.passwordHasher.hash(update.password)
    }

    if (update.email) {
      updateObj.email = update.email
    }

    return {
      _id: id,
      update: {$set: updateObj}
    }
  },

  /*****************************************************************************
   * idGenerator
   *
   * By configuring an idGenerator for this Collection we can control the _id values created for new objects
   * as they are inserted. Here we choose an IdGenerator to generate MongoDB ObjectId values but as strings instead
   * of native ObjectIds, which can be cumbersome for a public API as the client has to deal with EJSON encoding.
   * Our _id values will be strings.
   */
  idGenerator: o({
    _type: carbon.carbond.ObjectIdGenerator,
    generateStrings: true
  }),

  /*****************************************************************************
   * passwordHasher
   */
  passwordHasher: o({
    _type: carbon.carbond.security.BcryptHasher,
  }),

  /*****************************************************************************
   * publicUserView
   *
   * Strips out the password from the user for public consumption
   */
  publicUserView: function(obj) {
    let result = {
      _id: obj._id,
      email: obj.email
    }

    return result
  }
})
