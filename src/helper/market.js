const fs = require('fs');
const { providers: ethersProviders, Contract } = require('ethers');
const { providers } = require('@0xsequence/multicall');

const { getTokenPriceUSD } = require('./price');
const { E18, DOP } = require('./constant');
const { CERC20ABI, ComptrollerABI, PriceOracleABI } = require('../abis');
const comptrollerData = require('../data/comptroller.json');

const provider = new providers.MulticallProvider(
  new ethersProviders.JsonRpcProvider('https://cloudflare-eth.com/')
);

const getTokenPriceBySymbol = async (
  oracleAddr,
  marketAddr,
  ethPriceInUSD,
  underlyingSymbol,
  underlyingDecimals
) => {
  const OracleContract = new Contract(oracleAddr, PriceOracleABI, provider);

  if (
    underlyingSymbol === 'USDC' ||
    underlyingSymbol === 'DAI' ||
    underlyingSymbol === 'USDT'
  ) {
    underlyingPriceUSD = 1;
  } else if (underlyingSymbol === 'DOP') {
    underlyingPriceUSD = await getTokenPriceUSD(DOP);
  } else {
    underlyingPriceUSD =
      Number(await OracleContract.getUnderlyingPriceView(marketAddr)) / E18;
    if (underlyingDecimals < 18) {
      underlyingPriceUSD = underlyingPriceUSD / 10 ** (18 - underlyingDecimals);
    }
  }

  return {
    underlyingPriceUSD: underlyingPriceUSD,
    underlyingPriceETH: underlyingPriceUSD / ethPriceInUSD,
  };
};

const getMarketData = async (markets, poolAddr, oracleAddr, ethPriceInUSD) => {
  const data = [];

  const PoolContract = new Contract(poolAddr, ComptrollerABI, provider);
  const marketData = await Promise.all(
    markets.map((market) => {
      const MarketContract = new Contract(market.id, CERC20ABI, provider);
      return [
        MarketContract.borrowRatePerBlock(), // 0
        MarketContract.exchangeRateStored(), // 1
        MarketContract.totalReserves(), // 2
        MarketContract.supplyRatePerBlock(), // 3
        MarketContract.totalBorrows(), // 4
        MarketContract.totalSupply(), // 5
        MarketContract.getCash(), // 6
        MarketContract.interestRateModel(), // 7
        MarketContract.reserveFactorMantissa(), // 8
        PoolContract.markets(market.id), // 9
        getTokenPriceBySymbol(
          oracleAddr,
          market.id,
          ethPriceInUSD,
          market.underlyingSymbol,
          market.underlyingDecimals
        ), // 10
      ];
    })
  );

  for (let i = 0; i < marketData.length; i++) {
    const {
      name,
      id: marketAddr,
      symbol,
      // decimals: tokenDecimals,
      underlyingAddress,
      underlyingDecimals,
      underlyingName,
      underlyingSymbol,
    } = markets[i];

    const borrowRatePerBlock = await marketData[i][0];
    const exchangeRateStored = await marketData[i][1];
    const totalReserves = await marketData[i][2];
    const supplyRatePerBlock = await marketData[i][3];
    const totalBorrows = await marketData[i][4];
    const totalSupply = await marketData[i][5];
    const cash = await marketData[i][6];
    const interestRateModel = await marketData[i][7];
    const reserveFactorMantissa = await marketData[i][8];
    const cf = await marketData[i][9];
    const prices = await marketData[i][10];

    collateralFactor = Number(cf.collateralFactorMantissa) / E18;

    const row = {
      id: marketAddr,
      symbol,
      name: name.replace('Drops NFT Loans', '').trim(),
      reserves: Number(totalReserves) / 10 ** underlyingDecimals,
      cash: Number(cash) / 10 ** underlyingDecimals,
      totalBorrows: Number(totalBorrows) / 10 ** underlyingDecimals,
      totalSupply: Number(totalSupply) / 10 ** 8,
      borrowRate: (Number(borrowRatePerBlock) * 2628000) / E18,
      supplyRate: (Number(supplyRatePerBlock) * 2628000) / E18,
      exchangeRate:
        Number(exchangeRateStored) / 10 ** (10 + underlyingDecimals),
      interestRateModelAddress: interestRateModel,
      reserveFactor: Number(reserveFactorMantissa),
      underlyingAddress,
      underlyingName,
      underlyingSymbol: underlyingSymbol
        .replace('(rinkeby)', '')
        .replace(/mock/gi, '')
        .trim(),
      underlyingDecimals,
      underlyingPriceUSD: Number(prices.underlyingPriceUSD),
      underlyingPriceETH: Number(prices.underlyingPriceETH),
      collateralFactor,
      priceOracle: oracleAddr,
      poolAddr,
      // accrualBlockNumber: Number(accrualBlockNumber),
      // borrowIndex: Number(borrowIndex) / E18,
    };

    data.push(row);
  }

  return data;
};

const updateMarketData = async (network) => {
  const marketPath = `${process.cwd()}/data/markets${network}.json`;
  try {
    const ethPriceInUSD = await getTokenPriceUSD(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
    );

    console.log('===>ethPriceInUSD: ', ethPriceInUSD);

    const allMarketes = [];
    for (let i = 0; i < comptrollerData.length; i++) {
      console.log(`${i}th comptrolloer started: `, new Date());
      const marketData = await getMarketData(
        comptrollerData[i].markets,
        comptrollerData[i].poolAddr,
        comptrollerData[i].oracleAddr,
        Number(ethPriceInUSD)
      );
      allMarketes.push(marketData);
      console.log(`${i}th comptrolloer ended: `, new Date());
    }

    fs.writeFileSync(marketPath, JSON.stringify(allMarketes));
    return allMarketes;
  } catch (err) {
    console.log(`updateMarketData failed error=${err}`);
  }

  const prevMarketsData = await fs.readFileSync(marketPath, {
    encoding: 'utf8',
  });

  return JSON.parse(prevMarketsData);
};

module.exports = {
  updateMarketData,
};
