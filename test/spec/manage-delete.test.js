/**
 * @fileOverview Token manage delete tests.
 */
var Promise = require('bluebird');
var chai = require('chai');
var expect = chai.expect;

// var Web = require('../lib/web');
var boot = require('../lib/bootstrap');

describe('Manage Delete', function() {
  var bt;
  var req;

  describe('Delete', function () {
    boot.setup(function(store) {
      var manage = store.kansasManage(store.fix.api);
      manage.setup({
        provide: function(/* req, res */) {
          return Promise.resolve({
            ownerId: 'hip',
            policyName: 'free',
          });
        }
      });
      manage.addRoutes(store.app);
    }, function(res) {
      bt = res;
      req = bt.req;
    });

    it('Will return 204 when delete a token', function(done) {
      req.del('/token/' + bt.fix.token)
        .expect(204, done);
    });

    it('verify token is deleted', function(done) {
      req.del('/token/' + bt.fix.token)
        .expect(204)
        .end(function(err) {
          if (err) {return done(err);}
          bt.fix.api.get(bt.fix.token).then(function(res) {
            expect(res).to.be.null;
          }).then(done, done);
        });
    });
  });
});
