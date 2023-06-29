const CronJob = require('node-cron');
const fs = require('fs');
const {
  updateMarketData,
  updateProtocolStatusData,
  paths,
} = require('../helper');

const saveSnapshot = async (network) => {
  console.log(`snapshot started with network=${network}: `, new Date());

  try {
    const allMarkets = await updateMarketData(network);
    const statusData = await updateProtocolStatusData(allMarkets, network);
    // store in project
    await fs.writeFileSync(
      `src/data/status${network}.json`,
      JSON.stringify(statusData)
    );

    // store in public place
    await fs.writeFileSync(
      paths[network],
      JSON.stringify(statusData, null, '\t')
    );
  } catch (err) {
    console.log(`failed to process data on network=${network} error=${err}`);
  }

  console.log(`snapshot ended with network=${network}: `, new Date());
};

exports.initScheduledJobs = () => {
  const scheduledJobFunction = CronJob.schedule('*/5 * * * *', async () => {
    await saveSnapshot(1);
    // await saveSnapshot(4);
  });

  scheduledJobFunction.start();
};
