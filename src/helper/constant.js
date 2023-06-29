const E18 = 10 ** 18;

/**
 * TODO: different the path of server and local
 * server path: "/home/ec2-user/drops-is-client/build/status.json"
 * local path: "../drops-is-client/build/status.json"
 * We need to update this logic with env variable
 * Don't change "/home/ec2-user/drops-is-client/build/status.json" path when merging main branch
 */
const paths = {
  1: "/home/ec2-user/drops-is-client/build/status.json",
  4: "/home/ec2-user/drops-stage/build/status.json",
};

const unsupportedMarkets = {
  1: [
    "0xdf6602d43871b88d993b604d81731fd8a90cf645", // fiPunk v1
    "0x8c1cfae7866fa2cd4c82fea9a660cfb0faa7578f", // BAYC v1
    "0xd56c42e2adc844080eb7e13ad66ade8600470179", // MAYC v1
    "0xd0f97be2f6b0ce5af703c11d09082e1a0a3855be", // OTHR v1
    "0x3d60134fa81876f5afbad18a7520aa8596ba07ca", // SANDBOX issue
    "0xf6dc34c07eda4855b5075463dccffab42598415b", // CYBERBROKERS v1
    "0x5f5df50c011d527e19e50b1eac8a18e7827ed23b", // MOONBIRD v1 xx
    "0xee2ed59082a60c0af4bb2132b90d581134ea1fd5", // MOONBIRD v2 xx
    "0x7bb678a6c5dadb6b03032ef46c6263ff09bb2799", // MOONBIRD v3
    "0xa7b06c501e89a963ac9b33a41a571ad23ffeb502", // SQUIGGLES v1
    "0xa0bda1407b2686987a3aae553d2ede657a1d472b", // D4-Findeza-fl-v2
  ],
  4: [
    "0xfeb6bc88c1908123be804d081a7236c2cc266837", // MOONBIRD
    "0x401cd5cc35df7c1e1a592ba71a3eff2f00568081", // MOONBIRDV1
    "0x3b66b33299faed291203e1e1b5b4b3d6f7ce1946", // MOONBIRDV2
    "0xef2e51cfc1585ec15498553b151a75cc41f9cfc0", // MOONBIRDV2 issue
    "0xcf488fd81db4d51bf19d4af01fd355fb075711b8", // MOONBIRD issue
    "0xb95d39d2c2f32ef76e3ac59b5d46873e75ff5339", // fiPunk v1
    "0xde798e4dd37ed7eed3cdea888aa4c0a11bbbb93d", // BAYC v1
    "0xf02d78760d07771859f24c8ac7d45d34ad21c89c", // BAYC issue
    "0xc5074e660f6bcfb41e04562dd16e2b5c9b08e6bc", // MAYC v1
    "0xab8e807d740e0de46f72b26eef09c04127bb9bf9", // CYBERBROKERS v1
    "0xbaaa5ec1ec7a650d000ca53326a893010f84d015", // SQUIGGLES issue
    "0xcddf9e7cd710e1be37792ca9033fa6ca2c51e027", // CYBERBROKERS issue
    "0xcc77f223fbfc21cc8b2b799137c687d0e5078f36", // SQUIGGLES v1
  ],
};

const DOP = "0x6bb61215298f296c55b19ad842d3df69021da2ef";
const uniswapSubgraph = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";

module.exports = {
  E18,
  paths,
  unsupportedMarkets,
  DOP,
  uniswapSubgraph,
};
