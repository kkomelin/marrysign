// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import '@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol';

/**
 * @notice CurrencyConverter library allows to convert USD to ETH.
 *
 * Inspired by https://github.com/PatrickAlphaC/hardhat-fund-me-fcc/blob/main/contracts/PriceConverter.sol
 * (by https://github.com/PatrickAlphaC).
 */
library CurrencyConverter {
  /**
   * @notice Convert integer USD amount to Wei.
   */
  function convertUSDToWei(uint256 usdAmount, AggregatorV3Interface priceFeed)
    internal
    view
    returns (uint256)
  {
    // Converting USD value to the common base 10**18 for the simplicity.
    uint256 usdAmountCommonBased = usdAmount * 10**18;

    uint256 ethPriceInUsdBased = getETHPriceInUSD(priceFeed);

    return uint256((usdAmountCommonBased / ethPriceInUsdBased) * 10**18);
  }

  /**
   * @notice Return current ETH price in USD (multiplied to 10**18).
   */
  function getETHPriceInUSD(AggregatorV3Interface priceFeed)
    private
    view
    returns (uint256)
  {
    (, int256 answer, , , ) = priceFeed.latestRoundData();

    uint256 decimals = priceFeed.decimals();

    // To return a clear value from this method, we need to convert the value to our own common base 10**18.
    return uint256((uint256(answer) / 10**decimals) * 10**18);
  }
}
