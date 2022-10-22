import { ethers } from 'hardhat'

export const stringToHex = (text: string): string => {
  return ethers.utils.hexlify(ethers.utils.toUtf8Bytes(text))
}

export const nowTimestamp = (): number => {
  return Math.round(Date.now() / 1000)
}

export const terminationServiceFee = (
  terminationCost: number,
  serviceFeePercent: number
): number => {
  return (terminationCost * serviceFeePercent) / 100
}
