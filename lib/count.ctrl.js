/**
 * @fileOverview The Usage Count Controller
 */
var cip = require('cip');
var __ = require('lodash');

var kansasError = require('./error');

/**
 * The usage count controller.
 *
 * @param {kansas} kansas A Kansas instance.
 * @constructor
 */
var Count = module.exports = cip.extend(function(kansas) {
  this.kansas = kansas;

  /** @type {Object} A dict with options */
  this.options = {
    consumeUnits: 1,
    headerToken: 'X-Api-Token',
    headerCount: null,
    handleError: this.handleError.bind(this),
    handleSuccess: this.handleSuccess.bind(this),
  };
});

/**
 * Set options.
 *
 * @param {Object} options Option or Options to set.
 */
Count.prototype.setup = function(options) {
  this.options = __.defaults(options, this.options);
};

/**
 * Middleware export.
 *
 * @return {Function} The middleware.
 */
Count.prototype.use = function() {
  return this._countMiddleware.bind(this);
};

/**
 * Count a unit.
 *
 * @param {Object} req The request Object.
 * @param {Object} res The response Object.
 * @param {Function} next pass control.
 * @private
 */
Count.prototype._countMiddleware = function(req, res, next) {
  var token = req.header(this.options.headerToken);

  if (typeof token !== 'string' || !token.length) {
    var err = new kansasError.TokenNotExists();
    err.httpcode = 401;
    return this.options.handleError(res, err);
  }

  var self = this;
  this.kansas.consume(token, this.options.consumeUnits)
    .then(function(remaining) {
      self.options.handleSuccess(res, next, remaining);
    })
    .catch(function(error) {
      if (error instanceof self.kansas.error.TokenNotExists) {
        error.httpcode = 401;
      } else {
        error.httpcode = 401;
      }
      self.options.handleError(res, error);
    });
};

/**
 * Handle an error, send response to client.
 *
 * @param {Object} res The response Object.
 * @param {Error} error An error instance containing 'httpcode' key.
 */
Count.prototype.handleError = function(res, error) {
  res.statusCode = error.httpcode || 401;
  res.setHeader('Content-Type', 'application/json');
  var response = JSON.stringify({message: error.message});
  res.end(response);
};

/**
 * Handle success, add proper headers.
 *
 * @param {Object} res The response Object.
 * @param {Function} next The next callback.
 * @param {number} consumed how many units consumed.
 */
Count.prototype.handleSuccess = function(res, next, consumed) {
  if (this.options.headerCount) {
    res.setHeader(this.options.headerCount, consumed);
  }
  next();
};
