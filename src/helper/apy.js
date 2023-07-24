const { default: axios } = require('axios');
const fs = require('fs');
const BLOCKS_PER_DAY = 5 * 60 * 24;

const isDev = process.env.NODE_ENV === 'development';

const updateVaultAPY = async (network) => {
  let data = {};
  try {
    const auraVaultAPYRes = await axios.get('https://vault-api.drops.co/apy');
    if (auraVaultAPYRes && auraVaultAPYRes.data) {
      const keys = Object.keys(auraVaultAPYRes.data);
      for (const key of keys) {
        data[key] = {
          apy: auraVaultAPYRes.data[key],
          type: 'Aura Beefy Vault',
        };
      }
    }

    const yVaultAPYRes = await axios.get(
      'https://api.yearn.finance/v1/chains/1/vaults/all'
    );
    if (yVaultAPYRes && yVaultAPYRes.data && yVaultAPYRes.data.length > 0) {
      for (const yVaultAPY of yVaultAPYRes.data) {
        data[yVaultAPY.symbol.toLowerCase()] = {
          apy: yVaultAPY.apy.net_apy,
          type: 'Yearn Vault',
        };
      }
    }

    const path = isDev
      ? `src/data/vaultAPY${network}.json`
      : `${process.cwd()}/data/vaultAPY${network}.json`;

    await fs.writeFileSync(path, JSON.stringify(data));
  } catch (err) {
    console.log(err);
  }

  return data;
};

const getVaultAPY = async (market, network) => {
  try {
    const path = isDev
      ? `src/data/vaultAPY${network}.json`
      : `${process.cwd()}/data/vaultAPY${network}.json`;
    const apyData = await fs.readFileSync(path, {
      encoding: 'utf8',
    });

    const apys = JSON.parse(apyData);
    const keys = Object.keys(apys);

    const mns = market.name.split(' ');
    const marketName = mns[mns.length - 1].toLowerCase();
    const keyIndex = keys.findIndex((key) => key === marketName);
    if (keyIndex > -1) {
      return Number(apys[keys[keyIndex]].apy);
    }
  } catch (err) {}

  return 0;
};

const getDropsAPY = (market) => {
  const {
    compSupplySpeeds,
    compBorrowSpeeds,
    totalSupply,
    exchangeRate,
    underlyingPriceUSD,
    totalBorrows,
  } = market;

  let supplyDopApy = 0;
  if (compSupplySpeeds > 0 && supply > 0) {
    supplyDopApy = new BigNumber(compSupplySpeeds)
      .mul(365)
      .mul(BLOCKS_PER_DAY)
      .mul(dopPriceInUSD)
      .div(
        new BigNumber(totalSupply).times(exchangeRate).times(underlyingPriceUSD)
      );
  }

  let borrowDopApy = 0;
  if (compBorrowSpeeds > 0 && marketBorrows > 0) {
    borrowDopApy = new BigNumber(compBorrowSpeeds)
      .times(365)
      .times(blocksPerDay)
      .mul(dopPriceInUSD)
      .div(new BigNumber(totalBorrows).times(underlyingPriceUSD));
  }
  return {
    supply: supplyDopApy,
    borrow: borrowDopApy,
  };
};

const getInterestAPY = (market) => {
  const { borrowRate, supplyRate } = market;
  const borrowPeriodicRate = Math.pow(1 + +borrowRate, 1 / 12) - 1;
  const borrowAPY = borrowRate;
  const borrowAPR = borrowPeriodicRate * 12;

  const supplyPeriodicRate = Math.pow(1 + +supplyRate, 1 / 12) - 1;
  const supplyAPY = supplyRate;
  const supplyAPR = supplyPeriodicRate * 12;

  return {
    borrowAPY,
    supplyAPY,
    borrowAPR,
    supplyAPR,
  };
};

const getAPYs = async (market, dopPriceInUSD, network = 1) => {
  const vaultAPY = await getVaultAPY(market, network);
  const dropsAPY = getDropsAPY(market);
  const interestAPY = getInterestAPY(market);
  const netSupplyAPY =
    (1 + vaultAPY) * (1 + interestAPY.supplyAPY) - 1 + dropsAPY.supply;
  const netBorrowAPY =
    (1 + vaultAPY) * (1 + interestAPY.borrowAPY) - 1 - dropsAPY.borrow;

  const lendRates = {
    apy: interestAPY.supplyAPY,
    apr: interestAPY.supplyAPR,
    vaultAPY,
    dopAPY: dropsAPY.supply,
    netAPY: netSupplyAPY,
  };
  const borrowRates = {
    apy: interestAPY.borrowAPY,
    apr: interestAPY.borrowAPR,
    vaultAPY,
    dopAPY: dropsAPY.borrow,
    netAPY: netBorrowAPY,
  };

  return {
    lendRates,
    borrowRates,
  };
};

module.exports = {
  updateVaultAPY,
  getVaultAPY,
  getAPYs,
};
