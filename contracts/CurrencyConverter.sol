// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';

// import "hardhat/console.sol";

/**
 * @notice CurrencyConverter library allows to convert USD to ETH.
 *
 * Inspired by https://github.com/PatrickAlphaC/hardhat-fund-me-fcc/blob/main/contracts/PriceConverter.sol
 * (by https://github.com/PatrickAlphaC).
 */
library CurrencyConverter {
  // @dev A multiplier to support decimals.
  uint256 private constant MULTIPLIER = 10**18;

  /**
   * @notice Convert integer USD amount to Wei.
   */
  function convertUSDToWei(uint256 usdAmount, AggregatorV3Interface priceFeed)
    internal
    view
    returns (uint256)
  {
    (uint256 ethPrice, uint256 ethPriceDecimals) = getETHPriceInUSD(priceFeed);

    return
      uint256(((usdAmount * MULTIPLIER) / (ethPrice / 10**ethPriceDecimals)));
  }

  /**
   * @notice Return current ETH price in USD (multiplied to 10**18).
   * @return (uint256, uint256) Latest ETH price in USD and the number of decimals.
   */
  function getETHPriceInUSD(AggregatorV3Interface priceFeed)
    private
    view
    returns (uint256, uint256)
  {
    (, int256 answer, , , ) = priceFeed.latestRoundData();

    uint256 decimals = priceFeed.decimals();

    return (uint256(answer), decimals);
  }
}
