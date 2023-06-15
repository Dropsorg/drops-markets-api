const CronJob = require('node-cron');
const fs = require('fs');

const allMarkets = require('../data/markets.json');
const { getAllMarkets } = require('../helper/onchain');
const { formatMarketsInfo } = require('../helper/status');
const { paths } = require('../helper/constant');

const saveSnapshot = async (network) => {
  try {
    if (network === 1) {
      console.log('saveProductionSnapshot started');
    } else {
      console.log('saveTestSnapShot started');
    }
    const statusData = await formatMarketsInfo(allMarkets, network);
    await fs.writeFileSync(
      paths[network],
      JSON.stringify(statusData, null, '\t')
    );
  } catch (err) {
    console.log(`network=${network}, error=${err}`);
  }
};

exports.initScheduledJobs = () => {
  const scheduledJobFunction = CronJob.schedule('*/30 * * * *', async () => {
    await saveSnapshot(1);
    await saveSnapshot(5);
  });

  scheduledJobFunction.start();
};
