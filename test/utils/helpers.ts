import { BigNumber, BytesLike } from 'ethers'
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

export const terminationServiceFee = (
  terminationCost: BigNumber,
  serviceFeePercent: number
): BigNumber => {
  return terminationCost
    .mul(ethers.BigNumber.from(serviceFeePercent))
    .div(ethers.BigNumber.from(100))
}
