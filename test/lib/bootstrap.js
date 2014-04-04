/**
 * @fileOverview bootstraps all fixtures and test facilities.
 */

var fixtures = require('./fixtures-kansas');
var Webserver = require('./webserver');
var Web = require('./web');

var boot = module.exports = {};
var kansasConsume = require('../../consume');
var kansasCount = require('../../count');
var kansasManage = require('../../manage');

boot.setup = function(setupExpress, cb) {
  var fix;
  var webserver;
  var kConnect;
  var req;

  fixtures.setupCase(function(res) {
    fix = res;
  });

  beforeEach(function(done) {
    webserver = new Webserver();
    webserver.express(function(app) {
      setupExpress({
        app: app,
        fix: fix,
        kansasConsume: kansasConsume,
        kansasCount: kansasCount,
        kansasManage: kansasManage,
      });
    }).then(done.bind(null, null), done);
  });

  beforeEach(function() {
    var web = new Web(webserver.expressApp);
    req = web.req;
  });

  beforeEach(function() {
    cb({
      webserver: webserver,
      app: webserver.expressApp,
      fix: fix,
      kConnect: kConnect,
      req: req,
    });
  });

  afterEach(function(done) {
    webserver.close().then(done, done);
  });
};
