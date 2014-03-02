/*
 * Kansas Connect
 * Connect middleware for Kansas
 * https://github.com/thanpolas/kansas-connect
 *
 * Copyright (c) 2014 Thanasis Polychronakis
 * Licensed under the MIT license.
 */
var KansasConnect = require('./kansas.main.js');

/**
 * The main factory.
 *
 * @param {Object=} optOptions Options to configure Kansas.
 * @return {KansasConnect} A Kansas Connect instance.
 */
module.exports = function(optOptions) {
  return new KansasConnect(optOptions);
};
