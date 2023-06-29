const BigNumber = require('bignumber.js');

const { generatingSymbol } = require('./generatingText');
const { unsupportedMarkets } = require('./constant');

const updateProtocolStatusData = async (allMarkets, network) => {
  const pools = allMarkets.map((markets, index) => {
    let ethPrice;
    const metadata = markets.reduce(
      (
        a,
        {
          id,
          totalSupply,
          totalBorrows,
          cash: marketCash,
          collateralFactor,
          exchangeRate,
          symbol: collectionSymbol,
          underlyingPriceETH: priceETH,
          underlyingPriceUSD: priceUSD,
          underlyingDecimals: decimals,
          supplyRate: supplyRatePerBlock,
          borrowRate: borrowRatePerBlock,
          reserves,
        }
      ) => {
        a = a;

        const unsupportedContracts = unsupportedMarkets[network].map(
          (contract) => contract.toLowerCase()
        );
        if (unsupportedContracts.includes(id.toLowerCase())) return a;

        let symbol = generatingSymbol(collectionSymbol);

        const supply = new BigNumber(totalSupply).times(exchangeRate);
        const borrow = new BigNumber(totalBorrows);

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
          priceETH: (a.markets[symbol]?.priceETH || 0) + Number(priceETH),
          priceUSD: (a.markets[symbol]?.priceUSD || 0) + Number(priceUSD),
          cash: (a.markets[symbol]?.cash || 0) + Number(marketCash),
          cashUSD: (a.markets[symbol]?.cashUSD || 0) + marketCash * priceUSD,
          collateralFactor:
            (a.markets[symbol]?.collateralFactor || 0) +
            Number(collateralFactor),
        };
        a.markets[symbol].borrowLimit =
          (a.markets[symbol].collateralFactor * 85) / 100; // 85% of the collateral factor

        const lendPeriodicRate = Math.pow(1 + +supplyRatePerBlock, 1 / 12) - 1;
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
        id: markets[index].poolAddr,
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

    Object.entries(metadata.markets).map(([symbol, market]) => {
      metadata.markets[symbol].priceETH = Number(
        (metadata.markets[symbol].priceUSD / ethPrice).toFixed(10)
      );
    });

    return metadata;
  });

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
  updateProtocolStatusData,
};
