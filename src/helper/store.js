const fs = require('fs');
const { prodBuildPaths } = require('./constant');

const isDev = process.env.NODE_ENV === 'development';

const storeStatusData = async (statusData, network = 1) => {
  if (isDev) {
    //  TODO, comment before merge
    await fs.writeFileSync(
      `src/data/status${network}.json`,
      JSON.stringify(statusData, null, '\t')
    );
  } else {
    // store in project
    /**
     * TODO: different the path of server and local
     * server path: `${process.cwd()}/data/status${network}.json`
     * We need to update this logic with env variable
     * Don't change ${process.cwd()}/data path when merging main branch
     */
    await fs.writeFileSync(
      `${process.cwd()}/data/status${network}.json`,
      JSON.stringify(statusData, null, '\t')
    );

    // store in public place
    await fs.writeFileSync(
      prodBuildPaths[network],
      JSON.stringify(statusData, null, '\t')
    );
  }
};

const storeMarketData = async (markets, network = 1) => {
  let marketPath = isDev
    ? `src/data/markets${network}.json`
    : `${process.cwd()}/data/markets${network}.json`;

  if (markets.length > 0) {
    await fs.writeFileSync(marketPath, JSON.stringify(markets));
    return markets;
  }

  const prevMarketsData = await fs.readFileSync(marketPath, {
    encoding: 'utf8',
  });
  return JSON.parse(prevMarketsData);
};

module.exports = {
  storeStatusData,
  storeMarketData,
};
