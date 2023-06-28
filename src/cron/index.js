const CronJob = require('node-cron');
const fs = require('fs');

const { updateMarketData } = require('../helper/onchain');
const { updateProtocolStatusData } = require('../helper/status');
const { paths } = require('../helper/constant');

const saveSnapshot = async (network) => {
  try {
    if (network === 1) {
      console.log('saveProductionSnapshot started');
    } else {
      console.log('saveTestSnapShot started');
    }
    const allMarkets = await updateMarketData(network);
    const statusData = await updateProtocolStatusData(allMarkets, network);

    if (statusData && statusData.pools && statusData.pools.length > 0) {
      await fs.writeFileSync(
        paths[network],
        JSON.stringify(statusData, null, '\t')
      );
    }
  } catch (err) {
    console.log(`network=${network}, error=${err}`);
  }
};

exports.initScheduledJobs = () => {
  const scheduledJobFunction = CronJob.schedule('*/5 * * * *', async () => {
    await saveSnapshot(1);
    // await saveSnapshot(4);
  });

  scheduledJobFunction.start();
};
