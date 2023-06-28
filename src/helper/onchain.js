const fs = require('fs');
const { providers } = require('@0xsequence/multicall');
const { providers: ethersProviders, Contract } = require('ethers');
const {
  CERC20ABI,
  ERC20ABI,
  ComptrollerABI,
  PriceOracleABI,
  ETHUSDOracle,
} = require('../abis');
const comptrollerData = require('../data/comptroller.json');

const { E18, comptrollers: allComptrollers } = require('../helper/constant');
const provider = new providers.MulticallProvider(
  new ethersProviders.JsonRpcProvider('https://cloudflare-eth.com/')
);

const getOnChainMarketInfo = async (
  markets,
  poolAddr,
  oracleAddr,
  ethPriceInUSD,
  underlyingPriceDecimal = 18
) => {
  const data = [];

  const PoolContract = new Contract(poolAddr, ComptrollerABI, provider);
  const OracleContract = new Contract(oracleAddr, PriceOracleABI, provider);

  for (let i = 0; i < markets.length; i++) {
    try {
      let resData = {};
      let UnderlyingContract;

      const MarketContract = new Contract(markets[i], CERC20ABI, provider);
      const cTokenData = await Promise.all([
        MarketContract.symbol(), // 0
        MarketContract.borrowRatePerBlock(), // 1
        MarketContract.exchangeRateStored(), // 2
        MarketContract.name(), // 3
        MarketContract.totalReserves(), // 4
        MarketContract.supplyRatePerBlock(), // 5
        MarketContract.totalBorrows(), // 6
        MarketContract.totalSupply(), // 7
        MarketContract.getCash(), // 8
        MarketContract.interestRateModel(), // 9
        MarketContract.accrualBlockNumber(), // 10
        MarketContract.borrowIndex(), // 11
        MarketContract.reserveFactorMantissa(), // 12
      ]);

      let tokenDecimals = 18;
      if (!cTokenData[0].includes('ETH')) {
        resData.underlyingAddress = await MarketContract.underlying();
        UnderlyingContract = new Contract(
          resData.underlyingAddress,
          ERC20ABI,
          provider
        );

        await UnderlyingContract.decimals()
          .then(function (res) {
            resData.underlyingDecimals = res;
          })
          .catch(function (err) {
            resData.underlyingDecimals = 0;
          });
        tokenDecimals = Number(resData.underlyingDecimals);
      }
      let decimals = 10 ** tokenDecimals;

      // 1 block = 12s, 1 minute = 5 blocks 1 year = 2628000 blocks
      resData.id = markets[i];
      resData.symbol = cTokenData[0];
      resData.name = cTokenData[3];
      resData.reserves = Number(cTokenData[4]) / decimals;
      resData.cash = Number(cTokenData[8]) / decimals;
      resData.totalBorrows = Number(cTokenData[6]) / decimals;
      resData.totalSupply = Number(cTokenData[7]) / 10 ** 8;
      (resData.borrowRate = (Number(cTokenData[1]) * 2628000) / E18),
        (resData.supplyRate = (Number(cTokenData[5]) * 2628000) / E18);
      resData.exchangeRate = Number(cTokenData[2]) / 10 ** (10 + tokenDecimals);
      resData.interestRateModelAddress = cTokenData[9];
      resData.collateralFactor =
        (await PoolContract.markets(markets[i])).collateralFactorMantissa / E18;

      resData.borrowIndex = Number(cTokenData[11]) / E18;
      resData.reserveFactor = Number(cTokenData[12]);
      resData.accrualBlockNumber = Number(cTokenData[10]);
      ethPriceInUSD = ethPriceInUSD / decimals;

      if (resData.symbol.includes('ETH')) {
        resData.underlyingAddress =
          '0x0000000000000000000000000000000000000000';
        resData.underlyingName = 'Ether';
        resData.underlyingSymbol = 'ETH';
        resData.underlyingDecimals = 18;
        resData.underlyingPrice = 1;
        resData.underlyingPriceUSD = ethPriceInUSD;
      } else {
        if (!cTokenData[0].includes('ETH')) {
          [resData.underlyingName, resData.underlyingSymbol] =
            await Promise.all([
              UnderlyingContract.name(),
              UnderlyingContract.symbol(),
            ]);

          let tokenPriceUSD =
            (await OracleContract.getUnderlyingPriceView(markets[i])) / E18;

          resData.underlyingPrice = tokenPriceUSD / ethPriceInUSD;
          if (!cTokenData[0].includes('USDC')) {
            resData.underlyingPriceUSD =
              tokenPriceUSD / 10 ** underlyingPriceDecimal;
          } else {
            resData.underlyingPriceUSD = '1';
          }
        }
      }

      resData.blockTimestamp = (
        await provider.getBlock(resData.accrualBlockNumber)
      ).timestamp;

      resData.underlyingSymbol = resData.underlyingSymbol
        .replace('(rinkeby)', '')
        .replace(/mock/gi, '')
        .trim();
      resData.name = resData.name.replace('Drops NFT Loans', '').trim();
      resData.priceOracle = OracleContract.address;

      data.push(resData);
    } catch (err) {
      console.log(`failed getOnChainMarketInfo, data=${markets[i]}`, err);
    }
  }

  return data;
};

const getETHPrieceInUSD = async (network) => {
  const oracleContract = new Contract(
    network === 1
      ? '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
      : '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e',
    ETHUSDOracle,
    provider
  );
  const price = await oracleContract.latestAnswer();
  return Number(price) / 10 ** 8;
};

const updateMarketData = async (network) => {
  const allMarketes = [];
  console.log('=====>updateMarketData started: ', new Date());

  try {
    const ethPriceInUSD = await getETHPrieceInUSD(network);
    // const comptrollers = allComptrollers[network];
    // const comptrollerData = await Promise.all(
    //   comptrollers.map(async (comptroller) => {
    //     const ComptrollerContract = new Contract(
    //       comptroller.address,
    //       ComptrollerABI,
    //       provider
    //     );
    //     const markets = await ComptrollerContract.getAllMarkets();
    //     const oracleAddr = await ComptrollerContract.oracle();
    //     return {
    //       markets,
    //       oracleAddr,
    //       poolAddr: comptroller.address,
    //       comptrollerDecimals: comptroller.tokenDecimals,
    //     };
    //   })
    // );

    // await fs.writeFileSync(
    //   'src/data/comptroller.json',
    //   JSON.stringify(comptrollerData)
    // );

    for (let i = 0; i < comptrollerData.length; i++) {
      const marketData = await getOnChainMarketInfo(
        comptrollerData[i].markets,
        comptrollerData[i].poolAddr,
        comptrollerData[i].oracleAddr,
        parseFloat(ethPriceInUSD),
        comptrollerData[i].comptrollerDecimals
      );
      allMarketes.push(marketData);
    }

    if (network === 1) {
      await fs.writeFileSync(
        'src/data/markets.json',
        JSON.stringify(allMarketes)
      );
    } else {
      await fs.writeFileSync(
        'src/data/markets-test.json',
        JSON.stringify(allMarketes)
      );
    }
  } catch (err) {
    console.log(`updateMarketData failed error=${err}`);
  }
  console.log('=====>updateMarketData ended: ', new Date());

  return allMarketes;
};

module.exports = {
  getOnChainMarketInfo,
  updateMarketData,
};
