/**
 * @fileOverview The base Controller Class all controllers extend from.
 */
var cip = require('cip');

/**
 * The base Controller Class all controllers extend from.
 *
 * @constructor
 */
var Controller = module.exports = cip.extend();

/**
 * Return the client's IP
 *
 * @param  {Object} req The request object.
 * @return {string} The client's ip.
 */
Controller.prototype.getIp = function(req) {
  var ip = req.connection.remoteAddress;
  if (this.options.behindProxy) {
    ip = this.getIpFromProxy(req);
  }
  return ip;
};


/**
 * Return the client's IP when it's behind a proxy
 *
 * @param  {Object} req The request object.
 * @return {string} The client's ip.
 */
Controller.prototype.getIpFromProxy = function(req) {
  return req.headers['x-forwarded-for'].split(',')[0];
};
