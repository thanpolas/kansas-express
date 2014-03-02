/**
 * @fileOverview Rate limits.
 */
var Promise = require('bluebird');
var chai = require('chai');
var expect = chai.expect;

var Web = require('../lib/web');
var boot = require('../lib/bootstrap');

describe('Rate limiting', function() {
  var bt;
  var req;

  describe('Consume', function () {
    boot.setup(function(store) {
      store.app.get('/resource', store.kConnect.consume());
      store.app.get('/resource', function(req, res) {
        res.end('ok');
      });
    }, function(res) {
      bt = res;
      req = bt.req;
    });

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
        .set('X-Api-Token', bt.fix.token)
        .expect(200)
        .expect('X-RateLimit-Remaining', '9', done);
    });
    it('Will consume all units', function(done) {
      var times = new Array(10);
      Promise.map(times, function() {
        return new Promise(function(resolve, reject) {
          var web = new Web(bt.webserver.expressApp);
          web.req.get('/resource')
            .set('X-Api-Token', bt.fix.token)
            .expect(200)
            .end(function(err) {
              if (err) { return reject(err); }
              resolve();
            });
        });
      }).then(function() {
        var web = new Web(bt.webserver.expressApp);
        web.req.get('/resource')
          .set('X-Api-Token', bt.fix.token)
          .expect(429, done);
      }).catch(done);
    });
  });

  describe('Consume Configuration', function () {
    boot.setup(function(store) {
      store.app.get('/resource', store.kConnect.consume({
        consumeUnits: 5,
        headerToken: 'X-Token',
        headerRemaining: 'X-Remaining',
        handleError: function(res) {
          res.statusCode = 444;
          res.end('lol');
        }
      }));
      store.app.get('/resource', function(req, res) {
        res.end('ok');
      });
    }, function(res) {
      bt = res;
      req = bt.req;
    });

    it('Will reject a request without a token', function(done) {
      req.get('/resource')
        .expect(444, done);
    });
    it('Will reject a request an empty token', function(done) {
      req.get('/resource')
        .set('X-Token', '')
        .expect(444, done);
    });
    it('Will reject a request with a non existing token', function(done) {
      req.get('/resource')
        .set('X-Token', 'none existing')
        .expect(444, done);
    });
    it('Will consume a unit', function(done) {
      req.get('/resource')
        .set('X-Token', bt.fix.token)
        .expect(200)
        .expect('X-Remaining', '5', done);
    });
  });
});
