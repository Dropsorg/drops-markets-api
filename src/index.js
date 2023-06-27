const express = require('express');
const cors = require('cors');
const marketsData = require('./data/markets.json');
const marketsTestnetworkData = require('./data/markets-test.json');
const scheduledFunctions = require('./cron');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || '8001';

app.get('/main/drops-pool0', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send(marketsData[0] || []);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get('/main/drops-pool1', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send(marketsData[1] || []);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get('/main/drops-pool2', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send(marketsData[2] || []);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get('/main/drops-pool3', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send(marketsData[3] || []);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get('/main/drops-pool4', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send(marketsData[4] || []);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get('/main/drops-pool5', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send(marketsData[5] || []);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get('/main/drops-pool6', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send(marketsData[6] || []);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});

// Goerli testnet - chain id 5
app.get('/test/drops-pool0', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send(marketsTestnetworkData[0] || []);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get('/test/drops-pool1', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send(marketsTestnetworkData[1] || []);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get('/test/drops-pool2', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send(marketsTestnetworkData[2] || []);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get('/test/drops-pool3', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send(marketsTestnetworkData[3] || []);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get('/test/drops-pool4', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send(marketsTestnetworkData[4] || []);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get('/test/drops-pool5', async (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.status(200).send(marketsTestnetworkData[5] || []);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});

scheduledFunctions.initScheduledJobs();

app.listen(port, async () => {
  console.log(`Server listening on ${port}`);
});
