const Web3 = require("web3");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { cERC20, erc20, comptroller, priceOracle2 } = require("./abis");
const { bigDecimal, comptrollers } = require("./utils/constant");

const port = process.env.PORT || "8001";

// Using Infura WebSockets
const web3 = new Web3(
  new Web3.providers.WebsocketProvider(
    `wss://mainnet.infura.io/ws/v3/${process.env.INFURA_API_KEY}`
  )
);

const getMarkets = async (comp, underlyingPriceDecimal = 18) => {
  let result = {};
  result.data = {};
  result.data.markets = [];
  let comptrollerContract = new web3.eth.Contract(comptroller, comp);
  let oracleAddress = await comptrollerContract.methods.oracle().call();
  let oracleContract = new web3.eth.Contract(priceOracle2, oracleAddress);
  let allMarkets = await comptrollerContract.methods.getAllMarkets().call();

  await Promise.all(
    allMarkets.map(async (pool) => {
      let market = {};
      let poolContract = new web3.eth.Contract(cERC20, pool);

      let tokenDecimals = 18;
      let underlyingContract;
      market.symbol = await poolContract.methods.symbol().call();

      if (!market.symbol.includes("ETH")) {
        market.underlyingAddress = await poolContract.methods.underlying().call();
        underlyingContract = new web3.eth.Contract(erc20, market.underlyingAddress);
        await underlyingContract.methods
          .decimals()
          .call()
          .then(function (res) {
            market.underlyingDecimals = res;
          })
          .catch(function (err) {
            market.underlyingDecimals = 0;
          });
        tokenDecimals = Number(market.underlyingDecimals);
      }
      let decimals = 10 ** tokenDecimals;

      market.id = pool;
      // 1 block = 12s, 1 minute = 5 blocks
      // 1 year = 2628000 blocks
      market.borrowRate =
        (Number(await poolContract.methods.borrowRatePerBlock().call()) * 2628000) / bigDecimal;
      market.cash = (await poolContract.methods.getCash().call()) / decimals;
      let marketsFromComp = await comptrollerContract.methods.markets(pool).call();
      market.collateralFactor = marketsFromComp?.collateralFactorMantissa / bigDecimal;
      market.exchangeRate =
        (await poolContract.methods.exchangeRateStored().call()) / 10 ** (10 + tokenDecimals);
      market.interestRateModelAddress = await poolContract.methods.interestRateModel().call();
      market.name = await poolContract.methods.name().call();
      market.reserves = (await poolContract.methods.totalReserves().call()) / decimals;
      market.supplyRate =
        (Number(await poolContract.methods.supplyRatePerBlock().call()) * 2628000) / bigDecimal;
      market.totalBorrows = (await poolContract.methods.totalBorrows().call()) / decimals;
      market.totalSupply = (await poolContract.methods.totalSupply().call()) / 10 ** 8;
      let ethPriceInUSD =
        (await oracleContract.methods.getUnderlyingPriceView(allMarkets[0]).call()) / decimals;

      if (market.symbol.includes("ETH")) {
        market.underlyingAddress = "0x0000000000000000000000000000000000000000";
        market.underlyingName = "Ether";
        market.underlyingSymbol = "ETH";
        market.underlyingDecimals = 18;
        market.underlyingPrice = "1";
        market.underlyingPriceUSD = ethPriceInUSD;
      } else {
        market.underlyingName = await underlyingContract.methods.name().call();
        market.underlyingSymbol = await underlyingContract.methods.symbol().call();

        let tokenPriceUSD =
          (await oracleContract.methods.getUnderlyingPriceView(pool).call()) / bigDecimal;
        market.underlyingPrice = tokenPriceUSD / ethPriceInUSD;
        if (!market.symbol.includes("USDC")) {
          market.underlyingPriceUSD = tokenPriceUSD / 10 ** underlyingPriceDecimal;
        } else {
          market.underlyingPriceUSD = "1";
        }
      }

      market.accrualBlockNumber = await poolContract.methods.accrualBlockNumber().call();
      market.blockTimestamp = (await web3.eth.getBlock(market.accrualBlockNumber)).timestamp;
      market.borrowIndex = (await poolContract.methods.borrowIndex().call()) / bigDecimal;
      market.reserveFactor = await poolContract.methods.reserveFactorMantissa().call();

      result.data.markets.push(market);
    })
  );

  result.data.comptroller = {};
  result.data.comptroller.priceOracle = oracleAddress;

  return result;
};

app.get("/main/drops-pool0", async (req, res) => {
  try {
    const comptroller = comptrollers[1][0];
    const result = await getMarkets(comptroller, 0);

    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get("/main/drops-pool1", async (req, res) => {
  try {
    const comptroller = comptrollers[1][1];
    const result = await getMarkets(comptroller);

    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get("/main/drops-pool2", async (req, res) => {
  try {
    const comptroller = comptrollers[1][2];
    const result = await getMarkets(comptroller);

    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get("/main/drops-pool3", async (req, res) => {
  try {
    const comptroller = comptrollers[1][3];
    const result = await getMarkets(comptroller);

    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get("/main/drops-pool4", async (req, res) => {
  try {
    const comptroller = comptrollers[1][4];
    const result = await getMarkets(comptroller);

    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get("/main/drops-pool5", async (req, res) => {
  try {
    const comptroller = comptrollers[1][5];
    const result = await getMarkets(comptroller);

    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});

// Goerli testnet - chain id 5
app.get("/test/drops-pool0", async (req, res) => {
  try {
    const comptroller = comptrollers[5][0];
    const result = await getMarkets(comptroller, 0);

    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get("/test/drops-pool1", async (req, res) => {
  try {
    const comptroller = comptrollers[5][1];
    const result = await getMarkets(comptroller);

    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get("/test/drops-pool2", async (req, res) => {
  try {
    const comptroller = comptrollers[5][2];
    const result = await getMarkets(comptroller);

    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get("/test/drops-pool3", async (req, res) => {
  try {
    const comptroller = comptrollers[5][3];
    const result = await getMarkets(comptroller);

    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get("/test/drops-pool4", async (req, res) => {
  try {
    const comptroller = comptrollers[5][4];
    const result = await getMarkets(comptroller);

    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});
app.get("/test/drops-pool5", async (req, res) => {
  try {
    const comptroller = comptrollers[5][5];
    const result = await getMarkets(comptroller);

    res.header("Access-Control-Allow-Origin", "*");
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
    res.status(400).send(err);
  }
});

app.listen(port, async () => {
  console.log(`Server listening on ${port}`);
});
