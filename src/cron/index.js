const CronJob = require('node-cron');
const {
  updateMarketData,
  updateProtocolStatusData,
  getWETHPrice,
  getDOPPrice,
  generateComptrollerData,
  storeStatusData,
  updateVaultAPY,
  getMarketData,
} = require('../helper');

const saveSnapshot = async (network) => {
  console.log(`snapshot started with network=${network}: `, new Date());

  try {
    await updateVaultAPY(network);

    const ethPriceInUSD = await getWETHPrice();
    const dopPriceInUSD = await getDOPPrice(ethPriceInUSD);
    const allMarkets = await updateMarketData(
      network,
      ethPriceInUSD,
      dopPriceInUSD
    );
    const statusData = await updateProtocolStatusData(allMarkets, network);
    await storeStatusData(statusData);
  } catch (err) {
    console.log(`failed to process data on network=${network} error=${err}`);
  }

  console.log(`snapshot ended with network=${network}: `, new Date());
};

exports.initScheduledJobs = async () => {
  const scheduledJobFunction = CronJob.schedule('*/10 * * * *', async () => {
    await saveSnapshot(1);
    // await saveSnapshot(4);
  });
  scheduledJobFunction.start();
};
