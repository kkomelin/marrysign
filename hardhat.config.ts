import '@nomicfoundation/hardhat-toolbox'
import { HardhatUserConfig } from 'hardhat/config'

const config: HardhatUserConfig = {
  solidity: '0.8.17',
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
}

export default config
