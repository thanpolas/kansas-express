/**
 * @fileOverview The managing controller.
 */
var cip = require('cip');
var __ = require('lodash');

var kansasError = require('./error');

/**
 * The managing controller.
 *
 * @param {kansas} kansas A Kansas instance.
 * @constructor
 */
var Manage = module.exports = cip.extend(function(kansas) {
  this.kansas = kansas;
});

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
  };

  this.options = __.defaults(options, this.options);
};

/**
 * Initialize the manage controllers and routes.
 * 
 * @param {Connect} app An instance of connect.
 */
Manage.prototype.manage = function(app) {
  if (typeof this.options.provide !== 'function') {
    throw new TypeError('"options.provide" is not a callback, you need to' +
      ' define a callback.');
  }

  // add routes
  var prefix = this.options.prefix;
  app.get(prefix + '/token', this._getAll.bind(this));
  app.get(prefix + '/token/:token', this._getOne.bind(this));
  app.post(prefix + '/token', this._create.bind(this));
  app.del(prefix + '/token/:token', this._delete.bind(this));
};

/**
 * Get all tokens.
 * 
 * @param {Object} req The request Object.
 * @param {Object} res The response Object.
 * @private
 */
Manage.prototype._getAll = function(req, res) {
  var params = this.options.provide();
  var self;
  this.kansas.getByOwnerId(params.ownerId)
    .then(function(result) {
      self.options.handleSuccess(res, result);
    })
    .catch(function(err) {
      self.options.handleError(res, err);
    });
};


/**
 * Get a single token.
 * 
 * @param {Object} req The request Object.
 * @param {Object} res The response Object.
 * @private
 */
Manage.prototype._getOne = function(req, res) {
  var params = this.options.provide();
  var token = req.params.token;
  var self;
  this.kansas.get(token)
    .then(function(result) {
      if (params.ownerId !== result.ownerId) {
        // not owner of token
        var error = new kansasError.Authentication('Not allowed');
        return self.options.handleError(res, error);
      }
      self.options.handleSuccess(res, result);
    })
    .catch(function(err) {
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
Manage.prototype._delete = function(req, res) {
  var params = this.options.provide();
  var token = req.params.token;
  var self;
  this.kansas.get(token).then(function(result) {
    var error;
    if (!result) {
      error = kansasError.TokenNotExists();
      return self.options.handleError(res, error);
    }
    if (params.ownerId !== result.ownerId) {
      // not owner of token
      error = new kansasError.Authentication('Not allowed');
      return self.options.handleError(res, error);
    }
    return this.kansas.del(params)
      .then(function() {
        res.statusCode = 204;
        res.end();
      });
  }).catch(function(err) {
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
  var params = this.options.provide();
  var self;
  this.kansas.create(params)
    .then(function(result) {
      self.options.handleSuccess(res, result);
    })
    .catch(function(err) {
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
  res.statusCode = error.httpcode;
  res.setHeader('Content-Type', 'application/json');
  var response = JSON.stringify({message: error.message});
  res.end(response);
};

/**
 * Handle success.
 *
 * @param {Object} res The response Object.
 * @param {Function} next The next callback.
 * @param {number} remaining how many units remaining.
 */
Manage.prototype.handleSuccess = function(res, result) {
  res.setHeader('Content-Type', 'application/json');
  var response = JSON.stringify(result);
  res.end(response);
};
