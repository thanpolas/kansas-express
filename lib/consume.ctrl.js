/**
 * @fileOverview The consuming controller.
 */
var __ = require('lodash');
var logger = require('kansas/lib/main/logger.main');

var ControllerBase = require('./controller.base');
var kansasError = require('./error');

/**
 * The consuming controller.
 *
 * @param {kansas} kansas A Kansas instance.
 * @constructor
 */
var Consume = module.exports = ControllerBase.extend(function(kansas) {
  this.log = logger.getLogger('kansas-express.ctrl.consume');
  this.kansas = kansas;

  /** @type {Object} A dict with options */
  this.options = {
    consumeUnits: 1,
    headerToken: 'X-Api-Token',
    headerRemaining: 'X-RateLimit-Remaining',
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
Consume.prototype.setup = function(options) {
  this.options = __.defaults(options, this.options);
};

/**
 * Middleware export.
 *
 * @return {Function} The middleware.
 */
Consume.prototype.use = function() {
  return this._consumeMiddleware.bind(this);
};

/**
 * Consume a unit.
 *
 * @param {Object} req The request Object.
 * @param {Object} res The response Object.
 * @param {Function} next pass control.
 * @private
 */
Consume.prototype._consumeMiddleware = function(req, res, next) {
  var token = req.header(this.options.headerToken);

  if (typeof token !== 'string' || !token.length) {
    this.log.fine('_consumeMiddleware() :: No token was provided. Request IP:',
      this.getIp(req));
    var err = new kansasError.TokenNotExists();
    err.httpcode = 401;
    return this.options.handleError(res, err);
  }

  this.kansas.consume(token, this.options.consumeUnits)
    .bind(this)
    .then(function(remaining) {
      this.options.handleSuccess(res, next, remaining);
    })
    .catch(function(error) {
      if (error instanceof this.kansas.error.TokenNotExists) {
        this.log.fine('_consumeMiddleware() :: Token not found. Token:', token,
          'From ip:', this.getIp(req));
        error.httpcode = 401;
      } else if(error instanceof this.kansas.error.UsageLimit) {
        // Too Many Requests (RFC 6585)
        error.httpcode = 429;
      } else {
        this.log.fine('_consumeMiddleware() :: Query error for ip:', this.getIp(req),
          'Error:', err.message);
        this.log.finest('_consumeMiddleware() :: Query error stack:', err.stack);
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
Consume.prototype.handleError = function(res, error) {
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
 * @param {number} remaining how many units remaining.
 */
Consume.prototype.handleSuccess = function(res, next, remaining) {
  res.setHeader(this.options.headerRemaining, remaining);
  next();
};
