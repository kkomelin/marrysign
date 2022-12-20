import { BigNumber, BytesLike } from 'ethers'
import { ethers } from 'hardhat'
import { MarrySign } from '../../typechain'

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

export const compareAgreements = (
  agreement1: MarrySign.AgreementStruct,
  agreement2: MarrySign.AgreementStruct
): boolean => {
  return (
    agreement1.alice === agreement2.alice &&
    agreement1.bob === agreement2.bob &&
    agreement1.content === agreement2.content &&
    agreement1.id === agreement2.id &&
    agreement1.state === agreement2.state &&
    agreement1.terminationCost.toString() ===
      agreement2.terminationCost.toString() &&
    agreement1.updatedAt.toString() === agreement2.updatedAt.toString()
  )
}
