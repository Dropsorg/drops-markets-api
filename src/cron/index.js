const CronJob = require('node-cron');
const fs = require('fs');

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
    const allMarkets = await getAllMarkets(network);
    const statusData = await formatMarketsInfo(allMarkets, network);
    await fs.writeFileSync(
      paths[network],
      JSON.stringify(statusData, null, '\t')
    );
  } catch (err) {
    console.log(`network=${network}, error=${err}`);
  }
};

exports.initScheduledJobs = async () => {
  await saveSnapshot(1);
  // await saveSnapshot(4);

  const scheduledJobFunction = CronJob.schedule('*/30 * * * *', async () => {
    await saveSnapshot(1);
    // await saveSnapshot(4);
  });

  scheduledJobFunction.start();
};
