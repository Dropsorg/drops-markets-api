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
    console.log('path', process.cwd());
    // store in project
    fs.writeFileSync(
      `${process.cwd()}/data/status${network}.json`,
      JSON.stringify(statusData)
    );
console.log('Success stored data');
    // store in public place
    fs.writeFileSync(
      paths[network],
      JSON.stringify(statusData, null, '\t')
    );
  } catch (err) {
    console.log(`failed to process data on network=${network} error=${err}`);
  }

  console.log(`snapshot ended with network=${network}: `, new Date());
};

exports.initScheduledJobs = async () => {
  await saveSnapshot(1);
  const scheduledJobFunction = CronJob.schedule('*/5 * * * *', async () => {
    await saveSnapshot(1);
    // await saveSnapshot(4);
  });

  scheduledJobFunction.start();
};
