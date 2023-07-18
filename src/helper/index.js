const { E18, paths, unsupportedMarkets, DOP } = require('./constant');
const { generateComptrollerData } = require('./comptroller');
const { generatingSymbol } = require('./generatingText');
const { updateMarketData } = require('./market');
const { updateProtocolStatusData } = require('./status');
const { getWETHPrice, getDOPPrice } = require('./price');
const { storeStatusData, storeMarketData } = require('./store');

module.exports = {
  E18,
  paths,
  unsupportedMarkets,
  DOP,
  generateComptrollerData,
  updateProtocolStatusData,
  generatingSymbol,
  updateMarketData,
  getWETHPrice,
  getDOPPrice,
  storeStatusData,
  storeMarketData,
};
