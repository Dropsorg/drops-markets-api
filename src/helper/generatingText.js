const generatingSymbol = (symbol) => {
  /**
   * Remove these characters: D1, D2, ..D9, fl (floor), v2 (version 2), v3, -
   * ex: D2-CYBERBROKERS-fl => CYBERBROKERS, D4-FRAX => FRAX, D5-BAYC-fl-v2 => BAYC
   */
  let result = symbol.replace(
    /D0|D1|D2|D3|D4|D5|D6|D7|D8|D9|-|fl|floor|v2|v3|v4/g,
    ''
  );
  /**
   * If first character is d, remove first character
   * ex: dETH => ETH, dENJ => ENJ
   */
  if (result.charAt(0) === 'd') {
    result = result.slice(1);
  }
  return result.toUpperCase();
};

module.exports = {
  generatingSymbol,
};
