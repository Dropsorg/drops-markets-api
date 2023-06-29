const { providers: ethersProviders, Contract } = require('ethers');
const { providers } = require('@0xsequence/multicall');

const provider = new providers.MulticallProvider(
  new ethersProviders.JsonRpcProvider('https://cloudflare-eth.com/')
);

const getMarketDetails = async (markets) => {
  const data = [];

  const MarketContracts = markets.map(
    (market) => new Contract(market.address, CERC20ABI, provider)
  );

  for (let i = 0; i < markets.length; i++) {
    const { name, symbol } = markets[i];

    let underlyingAddress = '';
    let underlyingDecimals = '';
    let decimals = '';
    let underlyingName = '';
    let underlyingSymbol = '';

    if (symbol.includes('-ETH')) {
      underlyingAddress = '0x0000000000000000000000000000000000000000';
      underlyingName = 'Ether';
      underlyingSymbol = 'ETH';
      underlyingDecimals = 18;
      decimals = 8;
    } else if (name.includes('Floor')) {
      underlyingAddress = await MarketContracts[i].underlying();
      UnderlyingContract = new Contract(underlyingAddress, ERC20ABI, provider);
      [underlyingName, underlyingSymbol] = await Promise.all([
        UnderlyingContract.name(),
        UnderlyingContract.symbol(),
      ]);
      underlyingDecimals = 0;
      decimals = 0;
    } else {
      underlyingAddress = await MarketContracts[i].underlying();
      UnderlyingContract = new Contract(underlyingAddress, ERC20ABI, provider);
      [underlyingName, underlyingSymbol, underlyingDecimals, decimals] =
        await Promise.all([
          UnderlyingContract.name(),
          UnderlyingContract.symbol(),
          UnderlyingContract.decimals(),
          MarketContracts[i].decimals(),
        ]);
    }

    const d = {
      name,
      symbol,
      decimals: Number(decimals),
      underlyingAddress,
      underlyingName,
      underlyingSymbol,
      underlyingDecimals,
    };

    data.push(d);
  }

  return data;
};

const generateComptrollerData = async (comptroller) => {
  const ComptrollerContract = new Contract(
    comptroller.address,
    ComptrollerABI,
    provider
  );
  const markets = await ComptrollerContract.getAllMarkets();
  const oracleAddr = await ComptrollerContract.oracle();
  const marketsData = await getMarketDetails(markets);

  return {
    markets: marketsData,
    oracleAddr,
    poolAddr: comptroller,
  };
};

module.exports = {
  generateComptrollerData,
};
