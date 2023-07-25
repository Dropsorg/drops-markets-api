const BigNumber = require('bignumber.js');

const { generatingSymbol } = require('./generatingText');
const { unsupportedMarkets } = require('./constant');

const updateProtocolStatusData = (allMarkets, network) => {
  const pools = allMarkets.map((markets, index) => {
    const metadata = markets.reduce(
      (
        a,
        {
          id,
          symbol: collectionSymbol,
          reserves,
          cash: marketCash,
          totalBorrows,
          totalSupply,
          exchangeRate,
          underlyingDecimals: decimals,
          underlyingPriceUSD: priceUSD,
          underlyingPriceETH: priceETH,
          collateralFactor,
          apys,
        }
      ) => {
        a = a;

        if (
          unsupportedMarkets[network]
            .map((contract) => contract.toLowerCase())
            .includes(id.toLowerCase())
        )
          return a;

        const symbol = generatingSymbol(collectionSymbol);
        const supply = new BigNumber(totalSupply).times(exchangeRate);
        const borrow = new BigNumber(totalBorrows);
        const cash = supply.minus(borrow).times(priceUSD);
        a.TVL = a.TVL.plus(cash);
        a.totalSupply = a.totalSupply.plus(supply.times(priceUSD));
        if (decimals == 0) {
          a.totalNFTSupply = a.totalNFTSupply.plus(supply.times(priceUSD));
        }
        a.totalBorrow = a.totalBorrow.plus(borrow.times(priceUSD));
        a.markets[symbol] = {
          id,
          exchangeRate,
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

        a.lendRates[symbol] = {
          tokenSymbol: symbol,
          ...apys.lendRates,
        };
        a.borrowRates[symbol] = {
          tokenSymbol: symbol,
          ...apys.borrowRates,
        };
        return a;
      },
      {
        id: markets[0].comptroller,
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
