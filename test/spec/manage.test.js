/**
 * @fileOverview Token manage tests.
 */
var Promise = require('bluebird');
var chai = require('chai');
var expect = chai.expect;

var Web = require('../lib/web');
var boot = require('../lib/bootstrap');

describe('Manage', function() {
  var bt;
  var req;

  describe('Create', function () {
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

    it('Will create a new token', function(done) {
      req.post('/token')
        .set('Content-Type', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function(err, res) {
          expect(res.body.token).to.be.a('string');
          expect(res.body.token).to.have.length(32);
          expect(res.body.ownerId).to.equal('hip');
          expect(res.body.policyName).to.equal('free');
          expect(res.body.limit).to.equal(10);
          done();
        });
    });
  });
});
