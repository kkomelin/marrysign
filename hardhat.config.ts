import '@nomicfoundation/hardhat-toolbox'
import dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'
import 'solidity-docgen'
dotenv.config()

const MAINNET_RPC_URL =
  process.env.MAINNET_RPC_URL ||
  process.env.ALCHEMY_MAINNET_RPC_URL ||
  'https://eth-mainnet.alchemyapi.io/v2/your-api-key'

const GOERLI_RPC_URL =
  process.env.GOERLI_RPC_URL ||
  'https://eth-goerli.alchemyapi.io/v2/your-api-key'

const PRIVATE_KEY = process.env.PRIVATE_KEY || 'Your private account key'

const ETHERSCAN_API_KEY =
  process.env.ETHERSCAN_API_KEY || 'Your etherscan API key'

const config: HardhatUserConfig = {
  solidity: '0.8.17',
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 31337,
    },
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [`0x${PRIVATE_KEY}`] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      chainId: 5,
      // blockConfirmations: 6,
    },
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [`0x${PRIVATE_KEY}`] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      chainId: 1,
    },
  },
  etherscan: {
    // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
      goerli: ETHERSCAN_API_KEY,
    },
  },
}

export default config
