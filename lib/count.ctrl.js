/**
 * @fileOverview The Usage Count Controller
 */
var __ = require('lodash');
var logger = require('kansas/lib/main/logger.main');

var ControllerBase = require('./controller.base');
var kansasError = require('./error');

/**
 * The usage count controller.
 *
 * @param {kansas} kansas A Kansas instance.
 * @constructor
 */
var Count = module.exports = ControllerBase.extend(function(kansas) {
  this.log = logger.getLogger('kansas-express.ctrl.count');
  this.kansas = kansas;

  /** @type {Object} A dict with options */
  this.options = {
    consumeUnits: 1,
    headerToken: 'X-Api-Token',
    headerCount: null,
    handleError: this.handleError.bind(this),
    handleSuccess: this.handleSuccess.bind(this),
    behindProxy: false,
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

    this.log.fine('_countMiddleware() :: No token was provided. Request IP:',
      this.getIp(req));
    return this.options.handleError(res, err);
  }

  this.kansas.count(token, this.options.consumeUnits)
    .bind(this)
    .then(function(remaining) {
      this.options.handleSuccess(res, next, remaining);
    })
    .catch(function(error) {
      if (error instanceof this.kansas.error.TokenNotExists) {
        this.log.fine('_countMiddleware() :: Token not found. Token:', token,
          'From ip:', this.getIp(req));
        error.httpcode = 401;
      } else {
        this.log.fine('_countMiddleware() :: Query error for ip:', this.getIp(req),
          'Error:', err.message);
        this.log.finest('_countMiddleware() :: Query error stack:', err.stack);
        error.httpcode = 401;
      }
      this.options.handleError(res, error);
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
