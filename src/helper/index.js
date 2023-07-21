const { E18, paths, unsupportedMarkets, DOP } = require('./constant');
const { generateComptrollerData } = require('./comptroller');
const { generatingSymbol } = require('./generatingText');
const { updateMarketData, getMarketData } = require('./market');
const { updateProtocolStatusData } = require('./status');
const { getWETHPrice, getDOPPrice } = require('./price');
const { storeStatusData, storeMarketData } = require('./store');
const { updateVaultAPY } = require('./apy');

module.exports = {
  E18,
  paths,
  unsupportedMarkets,
  DOP,
  generateComptrollerData,
  updateProtocolStatusData,
  generatingSymbol,
  updateMarketData,
  getMarketData,
  getWETHPrice,
  getDOPPrice,
  storeStatusData,
  storeMarketData,
  updateVaultAPY,
};
