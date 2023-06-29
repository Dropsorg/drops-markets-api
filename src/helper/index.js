const {
  E18,
  paths,
  unsupportedMarkets,
  DOP,
  uniswapSubgraph,
} = require('./constant');
const { generateComptrollerData } = require('./comptroller');
const { generatingSymbol } = require('./generatingText');
const { updateMarketData } = require('./market');
const { updateProtocolStatusData } = require('./status');

module.exports = {
  E18,
  paths,
  unsupportedMarkets,
  DOP,
  uniswapSubgraph,
  generateComptrollerData,
  updateProtocolStatusData,
  generatingSymbol,
  updateMarketData,
};
