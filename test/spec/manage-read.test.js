/**
 * @fileOverview Token manage read tests.
 */
var Promise = require('bluebird');
var chai = require('chai');
var expect = chai.expect;

var tokenAssert = require('../lib/token-assertions');
// var Web = require('../lib/web');
var boot = require('../lib/bootstrap');

describe('Manage Read', function() {
  var bt;
  var req;

  describe('Read', function () {
    boot.setup(function(store) {
      store.kConnect.setup({
        provide: function(/* req, res */) {
          return Promise.resolve({
            userId: 'hip',
            policyName: 'free',
          });
        }
      });
      store.kConnect.manage(store.app);
    }, function(res) {
      bt = res;
      req = bt.req;
    });

    it('Will read all tokens', function(done) {
      req.get('/token')
        .set('Content-Type', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          expect(res.body).to.be.an('Array');
          res.body.forEach(function(tokenItem) {
            tokenAssert.all(tokenItem);
          });
          done();
        });
    });

    it('Will read a single token', function(done) {
      req.get('/token/' + bt.fix.token)
        .set('Content-Type', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          tokenAssert.all(res.body);
          done();
        });
    });
  });
});
