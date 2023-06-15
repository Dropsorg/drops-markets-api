const { providers } = require('@0xsequence/multicall');
const { providers: ethersProviders, Contract } = require('ethers');
const BigNumber = require('bignumber.js');

const { PriceOracleV2ABIT } = require('../abis');
const { generatingSymbol } = require('../helper/generatingText');

const {
  comptrollers: allComptrollers,
  unsupportedMarkets,
  DOP,
} = require('../helper/constant');
const { getTokenPriceUSD } = require('./DOP');

const provider = new providers.MulticallProvider(
  new ethersProviders.JsonRpcProvider('https://cloudflare-eth.com/')
);

const formatMarketsInfo = async (allMarkets, network) => {
  console.log('====>formatMarketsInfo started: ', new Date());
  const pools = await Promise.all(
    allMarkets.map(async (markets, index) => {
      let ethPrice;
      const metadata = await markets.reduce(
        async (
          a,
          {
            id,
            totalSupply,
            totalBorrows,
            cash: marketCash,
            collateralFactor,
            exchangeRate,
            symbol: collectionSymbol,
            underlyingPrice: price,
            // underlyingPriceUSD: priceUSD,
            underlyingDecimals: decimals,
            supplyRate: supplyRatePerBlock,
            borrowRate: borrowRatePerBlock,
            reserves,
            priceOracle,
          }
        ) => {
          a = await a;

          const unsupportedContracts = unsupportedMarkets[network].map(
            (contract) => contract.toLowerCase()
          );
          if (unsupportedContracts.includes(id.toLowerCase())) return a;

          let symbol = generatingSymbol(collectionSymbol);

          const supply = new BigNumber(totalSupply).times(exchangeRate);
          const borrow = new BigNumber(totalBorrows);

          const OracleContract = new Contract(
            priceOracle,
            PriceOracleV2ABIT,
            provider
          );
          let priceUSD;
          if (symbol === 'DOP') {
            priceUSD = await getTokenPriceUSD(DOP);
          } else {
            priceUSD =
              (await OracleContract.getUnderlyingPriceView(id)) /
              10 ** (36 - decimals);
          }

          if (symbol === 'ETH') {
            ethPrice = priceUSD;
          }

          const cash = supply.minus(borrow).times(priceUSD);
          a.TVL = a.TVL.plus(cash);
          a.totalSupply = a.totalSupply.plus(supply.times(priceUSD));
          if (decimals == 0) {
            a.totalNFTSupply = a.totalNFTSupply.plus(supply.times(priceUSD));
          }
          a.totalBorrow = a.totalBorrow.plus(borrow.times(priceUSD));
          a.markets[symbol] = {
            id,
            supply: (a.markets[symbol]?.supply || 0) + supply.toNumber(),
            borrow: (a.markets[symbol]?.borrow || 0) + borrow.toNumber(),
            reserves: (a.markets[symbol]?.reserves || 0) + Number(reserves),
            priceETH: (a.markets[symbol]?.priceETH || 0) + Number(price),
            priceUSD: (a.markets[symbol]?.priceUSD || 0) + Number(priceUSD),
            cash: (a.markets[symbol]?.cash || 0) + Number(marketCash),
            cashUSD: (a.markets[symbol]?.cashUSD || 0) + marketCash * priceUSD,
            collateralFactor:
              (a.markets[symbol]?.collateralFactor || 0) +
              Number(collateralFactor),
            maxLoan:
              ((a.markets[symbol]?.cashUSD || 0) + marketCash * priceUSD) *
              ((a.markets[symbol]?.collateralFactor || 0) +
                Number(collateralFactor)),
          };
          a.markets[symbol].borrowLimit =
            (a.markets[symbol].collateralFactor * 85) / 100; // 85% of the collateral factor
          a.markets[symbol].maxLoan =
            a.markets[symbol].cashUSD * a.markets[symbol].borrowLimit;

          const lendPeriodicRate =
            Math.pow(1 + +supplyRatePerBlock, 1 / 12) - 1;
          const borrowPeriodicRate =
            Math.pow(1 + +borrowRatePerBlock, 1 / 12) - 1;

          a.lendRates[symbol] = {
            apy: supplyRatePerBlock,
            apr: lendPeriodicRate * 12,
            tokenSymbol: symbol,
          };
          a.borrowRates[symbol] = {
            apy: borrowRatePerBlock,
            apr: borrowPeriodicRate * 12,
            tokenSymbol: symbol,
          };
          return a;
        },
        {
          id: allComptrollers[network][index].address,
          TVL: new BigNumber(0),
          totalSupply: new BigNumber(0),
          totalNFTSupply: new BigNumber(0),
          totalBorrow: new BigNumber(0),
          markets: {},
          lendRates: {},
          borrowRates: {},
        }
      );
      metadata.TVL = metadata.TVL.toNumber();
      metadata.totalSupply = metadata.totalSupply.toNumber();
      metadata.totalNFTSupply = metadata.totalNFTSupply.toNumber();
      metadata.totalBorrow = metadata.totalBorrow.toNumber();

      let totalMaxLoan = 0;
      Object.entries(metadata.markets).map(([symbol, market]) => {
        metadata.markets[symbol].priceETH = Number(
          (metadata.markets[symbol].priceUSD / ethPrice).toFixed(10)
        );
        totalMaxLoan += metadata.markets[symbol].maxLoan;
      });

      metadata.totalMaxLoan = totalMaxLoan;
      metadata.totalBorrowLimit = metadata.totalMaxLoan / metadata.TVL;

      return metadata;
    })
  );

  console.log('====>formatMarketsInfo end: ', new Date());

  return {
    ...pools.reduce(
      (a, { TVL, totalSupply, totalBorrow }) => ({
        TVL: a.TVL + TVL,
        totalSupply: a.totalSupply + totalSupply,
        totalBorrow: a.totalBorrow + totalBorrow,
      }),
      { TVL: 0, totalSupply: 0, totalBorrow: 0 }
    ),
    pools,
  };
};

module.exports = {
  formatMarketsInfo,
};
