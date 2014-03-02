/**
 * @fileOverview Rate limits.
 */
var Promise = require('bluebird');
var chai = require('chai');
var expect = chai.expect;

var kansasConnect = require('../../');

var Webserver = require('../lib/webserver');
var fixtures = require('../lib/fixtures-kansas');
var Web = require('../lib/web');

describe('Rate limiting', function() {
  var fix;
  var webserver;
  var kConnect;
  var req;

  fixtures.setupCase(function(res) {
    fix = res;
    kConnect = kansasConnect(fix.api);
  });

  beforeEach(function(done) {
    webserver = new Webserver();
    webserver.express(function(app) {
      app.get('/resource', kConnect.consume());
      app.get('/resource', function(req, res) {
        res.end('ok');
      });
    }).then(done.bind(null, null), done);
  });

  beforeEach(function() {
    var web = new Web(webserver.expressApp);
    req = web.req;
  });

  afterEach(function(done) {
    webserver.close().then(done, done);
  });

  describe('Consume', function () {
    it('Will reject a request without a token', function(done) {
      req.get('/resource')
        .expect(401, done);
    });
    it('Will reject a request an empty token', function(done) {
      req.get('/resource')
        .set('X-Api-Token', '')
        .expect(401, done);
    });
    it('Will reject a request with a non existing token', function(done) {
      req.get('/resource')
        .set('X-Api-Token', 'none existing')
        .expect(401, done);
    });
    it('Will consume a unit', function(done) {
      req.get('/resource')
        .set('X-Api-Token', fix.token)
        .expect(200)
        .expect('X-RateLimit-Remaining', '9', done);
    });
    it('Will consume all units', function(done) {
      var times = new Array(10);
      Promise.map(times, function() {
        return new Promise(function(resolve, reject) {
          var web = new Web(webserver.expressApp);
          web.req.get('/resource')
            .set('X-Api-Token', fix.token)
            .expect(200)
            .end(function(err) {
              if (err) { return reject(err); }
              resolve();
            });
        });
      }).then(function() {
        var web = new Web(webserver.expressApp);
        web.req.get('/resource')
          .set('X-Api-Token', fix.token)
          .expect(429, done);
      }).catch(done);
    });
  });
});

