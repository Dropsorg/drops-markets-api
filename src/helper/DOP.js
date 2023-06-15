const BigNumber = require('bignumber.js');
const { uniswapSubgraph } = require('../helper/constant');

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
      return Number(result);
    });
};

module.exports = {
  getTokenPriceUSD,
};
