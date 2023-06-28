const fs = require('fs');
const { providers } = require('@0xsequence/multicall');
const { providers: ethersProviders, Contract } = require('ethers');
const {
  CERC20ABI,
  ERC20ABI,
  ComptrollerABI,
  PriceOracleV2ABIT,
} = require('../abis');

const { E18, comptrollers: allComptrollers } = require('../helper/constant');

const provider = new providers.MulticallProvider(
  new ethersProviders.JsonRpcProvider('https://cloudflare-eth.com/')
);

const getOnChainMarketInfo = async (
  markets,
  PoolContract,
  OracleContract,
  ethPriceInUSD,
  underlyingPriceDecimal = 18
) => {
  const data = [];

  const comptrollerData = await Promise.all(
    markets.map((market) => PoolContract.markets(market))
  );

  for (let i = 0; i < markets.length; i++) {
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
      comptrollerData[i]?.collateralFactorMantissa / E18;

    resData.borrowIndex = Number(cTokenData[11]) / E18;
    resData.reserveFactor = Number(cTokenData[12]);
    resData.accrualBlockNumber = Number(cTokenData[10]);
    ethPriceInUSD = ethPriceInUSD / decimals;

    if (resData.symbol.includes('ETH')) {
      resData.underlyingAddress = '0x0000000000000000000000000000000000000000';
      resData.underlyingName = 'Ether';
      resData.underlyingSymbol = 'ETH';
      resData.underlyingDecimals = 18;
      resData.underlyingPrice = 1;
      resData.underlyingPriceUSD = ethPriceInUSD;
    } else {
      if (!cTokenData[0].includes('ETH')) {
        [resData.underlyingName, resData.underlyingSymbol, resData.tokenPrice] = await Promise.all([
          UnderlyingContract.name(),
          UnderlyingContract.symbol(),
          OracleContract.getUnderlyingPriceView(markets[i])
        ]);
        let tokenPriceUSD = resData.tokenPrice / E18;
        // let tokenPriceUSD =
        //   (await OracleContract.getUnderlyingPriceView(markets[i])) / E18;

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
  }

  return data;
};

const getAllMarkets = async (network) => {
  console.log('=====>getAllMarkets started: ', new Date());
  const comptrollers = allComptrollers[network];
  const allComptrollerMarkets = await Promise.all(
    comptrollers.map((comptroller) =>
      new Contract(
        comptroller.address,
        ComptrollerABI,
        provider
      ).getAllMarkets()
    )
  );
  const oracles = await Promise.all(
    comptrollers.map((comptroller) =>
      new Contract(comptroller.address, ComptrollerABI, provider).oracle()
    )
  );
  const allMarketes = [];
  for (let i = 0; i < comptrollers.length; i++) {
    const comptroller = comptrollers[i];
    const PoolContract = new Contract(
      comptroller.address,
      ComptrollerABI,
      provider
    );
    const OracleContract = new Contract(
      oracles[i],
      PriceOracleV2ABIT,
      provider
    );
    const ethPriceInUSD = await OracleContract.getUnderlyingPriceView(
      allComptrollerMarkets[i][0]
    );

    const marketData = await getOnChainMarketInfo(
      allComptrollerMarkets[i],
      PoolContract,
      OracleContract,
      ethPriceInUSD,
      comptroller.tokenDecimals
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

  console.log('=====>getAllMarkets ended: ', new Date());
  return allMarketes;
};

module.exports = {
  getOnChainMarketInfo,
  getAllMarkets,
};
