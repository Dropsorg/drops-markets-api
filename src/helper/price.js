const { providers: ethersProviders, Contract } = require('ethers');
const { providers } = require('@0xsequence/multicall');
const Scalar = require('ffjavascript').Scalar;

const uniswapLib = require('./uniswap-lib');
const { ChainlinkFactoryABI, UniswapV2Pair, ERC20ABI } = require('../abis');
const { E18 } = require('../helper/constant');

const provider = new providers.MulticallProvider(
  new ethersProviders.JsonRpcProvider('https://cloudflare-eth.com/')
);

const getWETHPrice = async () => {
  const ChainlinkFactory = new Contract(
    '0x4148D2220511d3521E232ff0F6369a14A9737c9A', // chainlink factory address
    ChainlinkFactoryABI,
    provider
  );

  return (
    Number(
      await ChainlinkFactory.getUSDPrice(
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' // weth address
      )
    ) / E18
  );
};

const getTokePriceFromUniswap = async (pairAddress, mainSymbol) => {
  const uniswapPair = new Contract(pairAddress, UniswapV2Pair, provider);

  // const addressToken0 = '0x6bB61215298F296C55b19Ad842D3Df69021DA2ef'; // await uniswapPair.token0(); DOP
  const token0Decimals = 18;
  const token0Symbol = 'DOP';

  // const addressToken1 = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; // await uniswapPair.token1(); WETH
  const token1Decimals = 18;
  const token1Symbol = 'WETH';

  const reservesInfo = await uniswapPair.getReserves();
  const reserve0 = Scalar.e(reservesInfo.reserve0);
  const reserve1 = Scalar.e(reservesInfo.reserve1);

  let tokenADecimals;
  let tokenBDecimals;

  let tokenAReserve;
  let tokenBReserve;

  let tokenASymbol;
  let tokenBSymbol;

  if (mainSymbol === token1Symbol) {
    tokenADecimals = token0Decimals;
    tokenBDecimals = token1Decimals;
    tokenAReserve = reserve0;
    tokenBReserve = reserve1;
    tokenASymbol = token0Symbol;
    tokenBSymbol = token1Symbol;
  } else {
    tokenADecimals = token1Decimals;
    tokenBDecimals = token0Decimals;
    tokenAReserve = reserve1;
    tokenBReserve = reserve0;
    tokenASymbol = token1Symbol;
    tokenBSymbol = token0Symbol;
  }

  const amountIn = Scalar.pow(10, tokenADecimals);
  const amountOut = uniswapLib.getAmountOut(
    amountIn,
    tokenAReserve,
    tokenBReserve
  );

  // compute price
  const finalAmountIn = Number(amountIn) / 10 ** tokenADecimals;
  const finalAmountOut = Number(amountOut) / 10 ** tokenBDecimals;

  return finalAmountIn / finalAmountOut;
};

const getDOPPrice = async (ethPriceInUSD) => {
  const priceInEth = await getTokePriceFromUniswap(
    '0x00aa1c57e894c4010fe44cb840ae56432d7ea1d1',
    'DOP'
  );
  return priceInEth * ethPriceInUSD;
};

module.exports = {
  getWETHPrice,
  getDOPPrice,
};
