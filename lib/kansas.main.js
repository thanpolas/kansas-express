/**
 * @fileOverview The main Kansas Connect class.
 */
var middlewarify = require('middlewarify');

var ConsumeCtrl = require('./consume.ctrl');
var ManageCtrl = require('./manage.ctrl');

/**
 * The main Kansas Connect class.
 *
 * @constructor
 */
module.exports = function(kansas) {

  middlewarify.make(this, 'setup');

  this.kansas = kansas;

  var consumeCtrl = new ConsumeCtrl(kansas);
  this.consume = consumeCtrl.use.bind(consumeCtrl);
  this.setup.use(consumeCtrl.setup.bind(consumeCtrl));

  var manageCtrl = new ManageCtrl(kansas);
  this.manage = manageCtrl.use.bind(manageCtrl);
  this.setup.use(manageCtrl.setup.bind(manageCtrl));
};

