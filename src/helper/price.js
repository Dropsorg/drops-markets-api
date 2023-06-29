const BigNumber = require('bignumber.js');
const fetch = require('node-fetch');
const { providers: ethersProviders, Contract } = require('ethers');
const { providers } = require('@0xsequence/multicall');

const { ETHUSDOracle } = require('../abis');
const { uniswapSubgraph } = require('../helper/constant');

const provider = new providers.MulticallProvider(
  new ethersProviders.JsonRpcProvider('https://cloudflare-eth.com/')
);

const getTokenPriceUSD = async (tokenAddress) => {
  return fetch(uniswapSubgraph, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
      {
        token(id: "${tokenAddress.toLowerCase()}"){
          derivedETH
        }
        bundle(id: "1") {
          ethPrice
        }
      }`,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      const derivedETH = data.data?.token?.derivedETH;
      const ethPrice = data.data?.bundle?.ethPrice;

      const result = new BigNumber(derivedETH || 0)
        .multipliedBy(ethPrice || 0)
        .toString();
      console.log('=====>getTokenPriceUSD', Number(result));
      return Number(result);
    });
};

module.exports = {
  getTokenPriceUSD,
};
