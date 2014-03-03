/**
 * @fileOverview Web server.
 */
var http = require('http');

var cip = require('cip');
var Promise = require('bluebird');
var express = require('express');


/**
 * The webserver test helper.
 *
 * @constructor
 */
var Webserver = module.exports = cip.extend(function() {

  /** @type {?express} Express instance. */
  this.expressApp = null;

  /** @type {?http} webserver The http instance. */
  this.http = null;
});

Webserver.Singleton = Webserver.extendSingleton();

/** @type {number} The default webserver port */
Webserver.PORT = 6969;

/**
 * Kick off an express webserver...
 *
 * @param {Function(Express)=} optPayload Will be invoked after express is setup and
 *   before the error handler middleware.
 * @return {Promise(Object)} a promise provides an object with these props:
 *   @param {Express} app The express instance.
 *   @param {http} webserver The http instance.
 */
Webserver.prototype.express = function(optPayload) {
  if (this.expressApp) {
    return Promise.resolve(this.expressApp);
  }

  var payload = optPayload || function() {};
  var self = this;
  return new Promise(function(resolve, reject) {
    var app = self.expressApp = express();

    // Setup express
    app.set('port', Webserver.PORT);
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    app.use(app.router);

    payload(app);

    var webserverPromise = self.startWebserver(app);

    Promise.all([
      webserverPromise,
    ]).then(function(result) {
      resolve({
        app: app,
        webserver: result[0],
      });
    })
      .catch(reject);
  });
};



/**
 * Start the webserver.
 *
 * @param {Express} app an express instance.
 * @return {Promise(http)} A Promise returning the http instance.
 */
Webserver.prototype.startWebserver = function(app) {
  if (this.http) {
    return Promise.resolve(this.http);
  }
  var self = this;
  return new Promise(function(resolve, reject) {
    var webserver = self.http = http.createServer(app);
    var port = app.get('port');

    webserver.on('clientError', function(err) {
      console.warn('tester.startWebserver() :: Client Error on port:', port, ':: Exception:', err);
      console.warn('tester.startWebserver() :: Client STACK:', err, err.stack);
    });
    webserver.on('error', function(err) {
      console.error('tester.startWebserver() :: Failed to start web server on port:', port,
        ':: Exception:', err);
      reject(err);
    });

    webserver.listen(app.get('port'), function(){
      // console.log('tester.startWebserver() :: Webserver launched. Listening on port: ' + port);
      resolve(webserver);
    });
  });
};

/**
 * Close the http server
 *
 * @return {Promise} A promise
 */
Webserver.prototype.close = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.http.close(function(err) {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};
