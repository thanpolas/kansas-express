/**
 * @fileOverview The consuming controller.
 */
var cip = require('cip');
var __ = require('lodash');

var kansasError = require('./error');

/**
 * The consuming controller.
 *
 * @param {kansas} kansas A Kansas instance.
 * @constructor
 */
var Consume = module.exports = cip.extend(function(kansas) {
  this.kansas = kansas;

});

Consume.prototype.setup = function(options) {
  this.options = {
    consumeUnits: 1,
    headerToken: 'X-Api-Token',
    headerRemaining: 'X-RateLimit-Remaining',
    handleError: this.handleError.bind(this),
    handleSuccess: this.handleSuccess.bind(this),
  };
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
      } else if(error instanceof self.kansas.error.UsageLimit) {
        // Too Many Requests (RFC 6585)
        error.httpcode = 429;
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
Consume.prototype.handleError = function(res, error) {
  res.statusCode = error.httpcode;
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
