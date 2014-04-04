/**
 * @fileOverview Setup Fixtures
 */

var tester = require('./tester');
var kansas = require('kansas');

var fixtures = module.exports = {};

/**
 * Provide some fixtures in the store:
 * - A Policy "free", maxTokens: 3, limit: 10, period: month
 * - A Policy "basic", maxTokens: 10, limit: 100, period: month
 * - A Token of policy "free"
 * - A second Token of policy "free"
 *
 * @param {Function(Object)} cb A callback with an object providing all references:
 *   @param {redis.RedisClient} client A redis client.
 *   @param {kansas.model.TokenModel} tokenModel
 *   @param {kansas.model.PolicyModel} policyModel
 *   @param {string} policyItem
 *   @param {string} token
 *   @param {Object} tokenItem
 */
fixtures.setupCase = function(cb) {
  var api;
  var policyItem;
  var policyItemBasic;
  var tokenItem;
  var tokenItemTwo;
  var policyItemCount;
  var tokenItemCount;

  var policyFree = {
    name: 'free',
    maxTokens: 3,
    limit: 10,
    period: 'month',
  };

  var policyBasic = {
    name: 'basic',
    maxTokens: 10,
    limit: 100,
    period: 'month',
  };

  var policyCount = {
    name: 'enterprise',
    maxTokens: 100,
    count: true,
  };

  tester.setup(function(done) {
    api = kansas({
      prefix: 'test-connect',
      logging: false,
    });
    api.connect().then(done, done);
  });

  tester.setup(function(done) {
    api.db.nuke('Yes purge all records irreversably', 'test-connect')
      .then(done, done);
  });

  tester.setup(function() {
    policyItem = api.policy.create(policyFree);
    policyItemBasic = api.policy.create(policyBasic);
    policyItemCount = api.policy.create(policyCount);
  });

  tester.setup(function() {
  });

  tester.setup(function(done) {
    api.create({
      policyName: policyItem.name,
      ownerId: 'hip',
    }).then(function(item) {
      tokenItem = item;
    }).then(done, done);
  });
  tester.setup(function(done) {
    api.create({
      policyName: policyItem.name,
      ownerId: 'hip',
    }).then(function(item) {
      tokenItemTwo = item;
    }).then(done, done);
  });
  tester.setup(function(done) {
    api.create({
      policyName: policyItemCount.name,
      ownerId: 'hop',
    }).then(function(item) {
      tokenItemCount = item;
    }).then(done, done);
  });

  tester.setup(function() {
    cb({
      api: api,
      policyItem: policyItem,
      policyItemBasic: policyItemBasic,
      token: tokenItem.token,
      tokenItem: tokenItem,
      tokenItemTwo: tokenItemTwo,
      policyItemCount: policyItemCount,
      tokenItemCount: tokenItemCount,
    });
  });
};
