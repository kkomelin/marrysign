import { BytesLike, BigNumber } from 'ethers'
import { ethers } from 'hardhat'

export const stringToHex = (text: string): string => {
  return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(text))
}

export const hexToString = (hex: BytesLike): string => {
  return ethers.utils.toUtf8String(hex)
}

export const nowTimestamp = (): number => {
  return Math.round(Date.now() / 1000)
}

export const terminationServiceFeeInUsd = (
  terminationCost: number,
  serviceFeePercent: number
): number => {
  return (terminationCost * serviceFeePercent) / 100
}

export const usdToWei = (
  usdAmount: number,
  ethPrice: BigNumber,
  ethPriceDecimals: number
): BigNumber => {
  const ethPriceUsd =
    Number(ethPrice.toString()) / Math.pow(10, ethPriceDecimals)

  return ethers.utils.parseEther((Number(usdAmount) / ethPriceUsd).toFixed(10)) // * Math.pow(10, 18)
}
