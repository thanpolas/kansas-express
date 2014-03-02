/**
 * @fileOverview The main Kansas Connect class.
 */
var cip = require('cip');

var ConsumeCtrl = require('./consume.ctrl');

/**
 * The main Kansas Connect class.
 *
 * @param {Object=} optOptions Options to configure Kansas.
 * @constructor
 */
var KansasConnect = module.exports = function(kansas, optOptions) {

  this.kansas = kansas;

  var consumeCtrl = new ConsumeCtrl(kansas);
  this.consume = consumeCtrl.use.bind(consumeCtrl);
};

