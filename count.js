/*
 * Kansas Connect
 * Connect middleware for Kansas
 * https://github.com/thanpolas/kansas-connect
 *
 * Copyright (c) 2014 Thanasis Polychronakis
 * Licensed under the MIT license.
 */
/**
 * @fileOverview Count bootstrap module.
 */
var CountCtrl = require('./lib/count.ctrl');

/**
 * The count bootstrap module.
 *
 * @param {kansas} kansas A Kansas instance.
 * @constructor
 */
module.exports = function(kansas) {
  return new CountCtrl(kansas);
};
