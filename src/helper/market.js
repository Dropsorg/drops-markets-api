const fs = require('fs');
const { providers: ethersProviders, Contract } = require('ethers');
const { providers } = require('@0xsequence/multicall');

const { E18, DOP } = require('./constant');
const comptrollerData = require('../data/comptroller.json');
const { storeMarketData } = require('./store');
const {
  CERC20ABI,
  ComptrollerABI,
  ComptrollerABI2,
  PriceOracleABI,
} = require('../abis');
const { getAPYs } = require('./apy');

const provider = new providers.MulticallProvider(
  new ethersProviders.JsonRpcProvider('https://cloudflare-eth.com/')
);

const getTokenPriceBySymbol = async (
  oracleAddr,
  marketAddr,
  ethPriceInUSD,
  underlyingSymbol,
  underlyingDecimals,
  dopPriceInUSD
) => {
  const OracleContract = new Contract(oracleAddr, PriceOracleABI, provider);

  if (
    underlyingSymbol === 'USDC' ||
    underlyingSymbol === 'DAI' ||
    underlyingSymbol === 'USDT'
  ) {
    underlyingPriceUSD = 1;
  } else if (underlyingSymbol === 'DOP') {
    underlyingPriceUSD = dopPriceInUSD;
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

const getMarketData = async (
  markets,
  comptroller,
  oracleAddr,
  ethPriceInUSD,
  dopPriceInUSD,
  supportCompBorrowSpeeds,
  network = 1
) => {
  const data = [];

  const PoolContract = new Contract(
    comptroller,
    supportCompBorrowSpeeds ? ComptrollerABI2 : ComptrollerABI,
    provider
  );

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
        MarketContract.reserveFactorMantissa(), // 7
        PoolContract.markets(market.id), // 8
        getTokenPriceBySymbol(
          oracleAddr,
          market.id,
          ethPriceInUSD,
          market.underlyingSymbol,
          market.underlyingDecimals,
          dopPriceInUSD
        ), // 9
      ].concat(
        supportCompBorrowSpeeds
          ? [
              PoolContract.compBorrowSpeeds(market.id), // 10
              PoolContract.compSupplySpeeds(market.id), // 11
            ]
          : [PoolContract.compSpeeds(market.id)] // 10
      );
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

    const compBorrowSpeeds = Number(await marketData[i][10]);
    const compSupplySpeeds = !supportCompBorrowSpeeds
      ? compBorrowSpeeds
      : Number(await marketData[i][11]);

    const collateralFactor =
      Number((await marketData[i][8]).collateralFactorMantissa) / E18;
    const borrowRate = (Number(await marketData[i][0]) * 2628000) / E18;
    const supplyRate = (Number(await marketData[i][3]) * 2628000) / E18;
    const exchangeRate =
      Number(await marketData[i][1]) / 10 ** (10 + underlyingDecimals);
    const reserves = Number(await marketData[i][2]) / 10 ** underlyingDecimals;
    const cash = Number(await marketData[i][6]) / 10 ** underlyingDecimals;
    const totalBorrows =
      Number(await marketData[i][4]) / 10 ** underlyingDecimals;
    const totalSupply = Number(await marketData[i][5]) / 10 ** 8;
    const reserveFactor = Number(await marketData[i][7]);

    const prices = await marketData[i][9];
    const underlyingPriceUSD = Number(prices.underlyingPriceUSD);
    const underlyingPriceETH = Number(prices.underlyingPriceETH);

    const row = {
      compBorrowSpeeds: Number(compBorrowSpeeds) / 10 ** 18,
      compSupplySpeeds: Number(compSupplySpeeds) / 10 ** 18,
      priceOracle: oracleAddr,
      comptroller,
      id: marketAddr,
      symbol,
      name: name.replace('Drops NFT Loans', '').trim(),
      underlyingAddress,
      underlyingName,
      underlyingSymbol: underlyingSymbol
        .replace('(rinkeby)', '')
        .replace(/mock/gi, '')
        .trim(),
      underlyingDecimals,
      underlyingPriceUSD,
      underlyingPriceETH,
      collateralFactor,
      reserves,
      cash,
      totalBorrows,
      totalSupply,
      borrowRate,
      supplyRate,
      exchangeRate,
      reserveFactor,
    };

    const apys = await getAPYs(row, dopPriceInUSD);
    row.apys = apys;

    data.push(row);
  }

  return data;
};

const updateMarketData = async (network, ethPriceInUSD, dopPriceInUSD) => {
  const allMarketes = [];

  try {
    for (let i = 0; i < comptrollerData.length; i++) {
      console.log(`${i}th comptrolloer started: `, new Date());
      const marketData = await getMarketData(
        comptrollerData[i].markets,
        comptrollerData[i].comptroller,
        comptrollerData[i].oracleAddr,
        Number(ethPriceInUSD),
        Number(dopPriceInUSD),
        comptrollerData[i].supportCompBorrowSpeeds,
        1
      );
      allMarketes.push(marketData);
      console.log(`${i}th comptrolloer ended: `, new Date());
    }
  } catch (err) {
    console.log(`updateMarketData failed error=${err}`);
  }

  return await storeMarketData(allMarketes);
};

module.exports = {
  updateMarketData,
  getMarketData,
};
