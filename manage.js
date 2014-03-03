/*
 * Kansas Connect
 * Connect middleware for Kansas
 * https://github.com/thanpolas/kansas-connect
 *
 * Copyright (c) 2014 Thanasis Polychronakis
 * Licensed under the MIT license.
 */
/**
 * @fileOverview Manage bootstrap module.
 */
var KansasManage = require('./lib/manage.ctrl');

/**
 * The manage bootstrap module.
 *
 * @param {kansas} kansas A Kansas instance.
 * @constructor
 */
module.exports = function(kansas) {
  return new KansasManage(kansas);
};
