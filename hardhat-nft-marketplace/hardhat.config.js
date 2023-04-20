require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()
const MAINNET_RPC_URL =
   
    process.env.ALCHEMY_MAINNET_RPC_URL ||
    "https://eth-mainnet.alchemyapi.io/v2/GtncwYNb-onjlTYZgTH3j1hQtSYIQ0UE"
const GOERLI_RPC_URL =
    process.env.GOERLI_RPC_URL || "https://eth-goerli.alchemyapi.io/v2/GtncwYNb-onjlTYZgTH3j1hQtSYIQ0UE"

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x"
// optional


// Your API key for Etherscan, obtain one at https://etherscan.io/
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "XYZ8J8KWJTSIYVH1DXBV6DYMTJQS7ZM5SP"

const REPORT_GAS = process.env.REPORT_GAS || false

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
      hardhat: {
          // // If you want to do some forking, uncomment this
          // forking: {
          //   url: MAINNET_RPC_URL
          // }
          chainId: 31337,
          blockConfirmations :6,
      },
      localhost: {
          chainId: 31337,
          blockConfirmations :6,
      },
      goerli: {
          url: GOERLI_RPC_URL,
          accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
          //   accounts: {
          //     mnemonic: MNEMONIC,
          //   },
          saveDeployments: true,
          chainId: 5,
          blockConfirmations :6,
      },
      mainnet: {
          url: MAINNET_RPC_URL,
          accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
          //   accounts: {
          //     mnemonic: MNEMONIC,
          //   },
          saveDeployments: true,
          chainId: 1,
          blockConfirmations :6,
      },
  
  },
  etherscan: {
      // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
      apiKey: {
          goerli: ETHERSCAN_API_KEY,
          
      },
      customChains: [
          {
              network: "goerli",
              chainId: 5,
              urls: {
                  apiURL: "https://api-goerli.etherscan.io/api",
                  browserURL: "https://goerli.etherscan.io",
              },
          },
      ],
  },
  gasReporter: {
      enabled: REPORT_GAS,
      currency: "USD",
      outputFile: "gas-report.txt",
      noColors: true,
      // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  contractSizer: {
      runOnCompile: false,
      only: ["Raffle"],
  },
  namedAccounts: {
      deployer: {
          default: 0, // here this will by default take the first account as deployer
          1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
      },
      player: {
          default: 1,
      },
  },
  solidity: {
    compilers: [
        {
            version: "0.8.8",
        },
        {
            version: "0.6.6",
        },
    ],
},
  mocha: {
      timeout: 500000, // 500 seconds max for running tests
  },
}