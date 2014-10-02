/**
 * @fileOverview The managing controller.
 */
var __ = require('lodash');
var Promise = require('bluebird');
var middlewarify = require('middlewarify');
var logger = require('kansas/lib/main/logger.main');

var ControllerBase = require('./controller.base');
var kansasError = require('./error');

function noop() {}

/**
 * The managing controller.
 *
 * @param {kansas} kansas A Kansas instance.
 * @constructor
 */
var Manage = module.exports = ControllerBase.extend(function(kansas) {
  this.log = logger.getLogger('kansas-express.ctrl.manage');
  this.kansas = kansas;

  // create the exported middleware
  var handleError = {
    // express invokes middleware without an error handler,
    // thus the catchAll is stubed to noop so bluebird won't
    // warn for unhandled errors.
    catchAll: noop,
  };
  middlewarify.make(this, 'create', this._create.bind(this), handleError);
  middlewarify.make(this, 'readOne', this._readOne.bind(this), handleError);
  middlewarify.make(this, 'readAll', this._readAll.bind(this), handleError);
  middlewarify.make(this, 'del', this._del.bind(this), handleError);

  this.create.use(this.getParams.bind(this));
  this.readOne.use(this.getParams.bind(this));
  this.readAll.use(this.getParams.bind(this));
  this.del.use(this.getParams.bind(this));
});

/** @enum {string} Actions */
Manage.Action = {
  CREATE: 'create',
  READ_ONE: 'readOne',
  READ_ALL: 'readAll',
  DELETE: 'delete',
};

/**
 * Setup instance.
 *
 * @param {Object} options Options to configure the controller.
 * @return {Function} The middleware.
 */
Manage.prototype.setup = function(options) {
  this.options = {
    prefix: '',
    provide: null,
    handleError: this.handleError.bind(this),
    handleSuccess: this.handleSuccess.bind(this),
    behindProxy: false,
  };

  this.options = __.defaults(options, this.options);
};

/**
 * Initialize the manage controllers and routes.
 *
 * @param {Connect} app An instance of connect.
 */
Manage.prototype.addRoutes = function(app) {
  if (typeof this.options.provide !== 'function') {
    throw new TypeError('"options.provide" is not a callback, you need to' +
      ' define a callback.');
  }

  // add routes
  var prefix = this.options.prefix;
  app.get(prefix + '/token', this.readAll);
  app.get(prefix + '/token/:token', this.readOne);
  app.post(prefix + '/token', this.create);
  app.delete(prefix + '/token/:token', this.del);
};

/**
 * Get all tokens.
 *
 * @param {Object} req The request Object.
 * @param {Object} res The response Object.
 * @private
 */
Manage.prototype._readAll = function(req, res) {
  this.kansas.getByOwnerId(req.kansas.ownerId)
    .bind(this)
    .then(function(result) {
      this.options.handleSuccess(res, result, Manage.Action.READ_ALL);
    })
    .catch(function(err) {
      this.log.fine('_readAll() :: Operation Error for IP:', this.getIp(req),
        'Error:', err.message);
      this.log.finest('_readAll() :: Operation Error Stack:', err.stack);
      err.httpcode = 500;
      this.options.handleError(res, err);
    });
};


/**
 * Get a single token.
 *
 * @param {Object} req The request Object.
 * @param {Object} res The response Object.
 * @private
 */
Manage.prototype._readOne = function(req, res) {
  var token = req.params.token;
  var self = this;
  this.kansas.get(token)
    .then(function(result) {
      if (req.kansas.ownerId !== result.ownerId) {
        // not owner of token
        var error = new kansasError.Authentication('Not allowed');
        return self.options.handleError(res, error);
      }
      self.options.handleSuccess(res, result, Manage.Action.READ_ONE);
    })
    .catch(function(err) {
      this.log.fine('_readOne() :: Operation Error for IP:', this.getIp(req),
        'Error:', err.message);
      this.log.finest('_readOne() :: Operation Error Stack:', err.stack);
      err.httpcode = 500;
      self.options.handleError(res, err);
    });
};

/**
 * Delete a token.
 *
 * @param {Object} req The request Object.
 * @param {Object} res The response Object.
 * @private
 */
Manage.prototype._del = function(req, res) {
  var token = req.params.token;
  var self = this;
  this.kansas.get(token).then(function(result) {
    var error;
    if (!result) {
      error = kansasError.TokenNotExists();
      return self.options.handleError(res, error);
    }
    if (req.kansas.ownerId !== result.ownerId) {
      // not owner of token
      error = new kansasError.Authentication('Not allowed');
      return self.options.handleError(res, error);
    }
    return self.kansas.del(result.token)
      .then(function() {
        self.options.handleSuccess(res, result, Manage.Action.DELETE);
      });
  }).catch(function(err) {
    this.log.fine('_del() :: Operation Error for IP:', this.getIp(req),
      'Error:', err.message);
    this.log.finest('_del() :: Operation Error Stack:', err.stack);
    err.httpcode = 500;
    self.options.handleError(res, err);
  });
};

/**
 * Create a token.
 *
 * @param {Object} req The request Object.
 * @param {Object} res The response Object.
 * @private
 */
Manage.prototype._create = function(req, res) {
  var self = this;
  this.kansas.create(req.kansas)
    .then(function(result) {
      self.options.handleSuccess(res, result, Manage.Action.CREATE);
    })
    .catch(function(err) {
      this.log.fine('_create() :: Operation Error for IP:', this.getIp(req),
        'Error:', err.message);
      this.log.finest('_create() :: Operation Error Stack:', err.stack);

      if(err instanceof self.kansas.error.Policy) {
        err.httpcode = 403; // Forbidden
      } else {
        err.httpcode = 500;
      }
      self.options.handleError(res, err);
    });
};

/**
 * Handle an error, send response to client.
 *
 * @param {Object} res The response Object.
 * @param {Error} error An error instance containing 'httpcode' key.
 */
Manage.prototype.handleError = function(res, error) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = error.httpcode || 500;
  var response = JSON.stringify({message: error.message});
  res.end(response);
};

/**
 * Handle success.
 *
 * @param {Object} res The response Object.
 * @param {Object=} result The operation result
 * @param {Manage.Action} action The action performed.
 */
Manage.prototype.handleSuccess = function(res, result, action) {
  if (action === Manage.Action.DELETE) {
    res.statusCode = 204;
    return res.end();
  }

  res.setHeader('Content-Type', 'application/json');
  var response = JSON.stringify(result);
  res.end(response);
};

/**
 * Express middleware to populate parameters.
 *
 * @param {Object} req The request Object.
 * @param {Object} res The response Object.
 */
Manage.prototype.getParams = function(req, res) {
  var self = this;
  return Promise.try(this.options.provide.bind(null, req, res))
    .then(function(params) {
      var error;
      if (!__.isObject(params)) {
        error = new TypeError('Internal Error');
        error.name = 'Invalid type in value provided by provide()';
        error.httpcode = 500;
        self.handleError(res, error);
        throw error;
      }
      if (!params.ownerId) {
        error = new TypeError('Internal Error');
        error.name = 'Now "ownerId" was provided using provide()';
        error.httpcode = 500;
        self.handleError(res, error);
        throw error;
      }

      req.kansas = params;
    }).catch(function(err) {
      this.log.fine('getParams() :: Operation Error for IP:', this.getIp(req),
        'Error:', err.message);
      this.log.finest('getParams() :: Operation Error Stack:', err.stack);

      if (err instanceof TypeError && err.message === 'Internal Error') {
        // it's thrown from previous then()
        throw err;
      }
      var error = new kansasError.BaseError(err);
      error.message = 'Internal Error';
      error.httpcode = 500;
      self.handleError(res, error);
      throw error;
    });
};
