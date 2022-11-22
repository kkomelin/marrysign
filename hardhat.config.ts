import '@nomicfoundation/hardhat-toolbox'
import { HardhatUserConfig } from 'hardhat/config'
import 'solidity-docgen'

require('dotenv').config()

const MAINNET_RPC_URL =
  process.env.MAINNET_RPC_URL ||
  process.env.ALCHEMY_MAINNET_RPC_URL ||
  'https://eth-mainnet.alchemyapi.io/v2/your-api-key'

const GOERLI_RPC_URL =
  process.env.GOERLI_RPC_URL ||
  'https://eth-goerli.alchemyapi.io/v2/your-api-key'

const PRIVATE_KEY = process.env.PRIVATE_KEY || 'Your private account key'

// Your API key for Etherscan, obtain one at https://etherscan.io/
const ETHERSCAN_API_KEY =
  process.env.ETHERSCAN_API_KEY || 'Your etherscan API key'

const POLYGON_MUMBAI_RPC_URL =
  process.env.POLYGON_MUMBAI_RPC_URL ||
  'https://fluent-multi-research.matic-testnet.discover.quiknode.pro/your-api-key'

const POLYGONSCAN_API_KEY =
  process.env.POLYGONSCAN_API_KEY || 'Your etherscan API key'

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.17',
      },
      {
        version: '0.6.6',
      },
    ],
  },
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
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      chainId: 5,
      // blockConfirmations: 6,
    },
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      //   accounts: {
      //     mnemonic: MNEMONIC,
      //   },
      chainId: 1,
    },
    polygonMumbai: {
      url: POLYGON_MUMBAI_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
      goerli: ETHERSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
    },
  },
}

export default config
