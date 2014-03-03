/*
 * Kansas Connect
 * Connect middleware for Kansas
 * https://github.com/thanpolas/kansas-connect
 *
 * Copyright (c) 2014 Thanasis Polychronakis
 * Licensed under the MIT license.
 */
/**
 * @fileOverview Consume bootstrap module.
 */
var ConsumeCtrl = require('./lib/consume.ctrl');

/**
 * The consuming bootstrap module.
 *
 * @param {kansas} kansas A Kansas instance.
 * @constructor
 */
module.exports = function(kansas) {
  return new ConsumeCtrl(kansas);
};
