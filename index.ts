import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import { SafeFactory, SafeAccountConfig, EthersAdapter } from '@safe-global/protocol-kit'
import dotenv from 'dotenv'

dotenv.config()

// https://chainlist.org/?search=goerli&testnets=true
const RPC_URL = 'https://eth-goerli.public.blastapi.io'
const provider = new ethers.providers.JsonRpcProvider(RPC_URL)

// Initialize signers
const owner1Signer = new ethers.Wallet(process.env.OWNER_1_PRIVATE_KEY!, provider)
const owner2Signer = new ethers.Wallet(process.env.OWNER_2_PRIVATE_KEY!, provider)
const owner3Signer = new ethers.Wallet(process.env.OWNER_3_PRIVATE_KEY!, provider)

const ethAdapterOwner1 = new EthersAdapter({
    ethers,
    signerOrProvider: owner1Signer
})
// console.log(ethAdapterOwner1)    

async function initAPIKit() {
    const txServiceUrl = 'https://safe-transaction-goerli.safe.global'
    const safeService = new SafeApiKit({ txServiceUrl, ethAdapter: ethAdapterOwner1 })
    return safeService
    // console.log(safeService)
}

async function createSafe() {
    const safeFactory = await SafeFactory.create({ ethAdapter: ethAdapterOwner1 });
    const safeAccountConfig: SafeAccountConfig = {
        owners: [
            await owner1Signer.getAddress(),
            // await owner2Signer.getAddress(), // optional for testing
            // await owner3Signer.getAddress() // optional for testing
        ],
        threshold: 1,
        // ... (Optional params)
    }
    // /* This Safe is tied to owner 1 because the factory was initialized with
    // an adapter that had owner 1 as the signer. */
    try {
        const safeSdkOwner1 = await safeFactory.deploySafe({ safeAccountConfig }) // this reverts with "cannot estimate gas"
        // console.log(safeSdkOwner1)
        const safeAddress = await safeSdkOwner1.getAddress()
        console.log(safeAddress)    
    } catch (error) {
        console.log('Failed to deploy safe:', error)
    }

    // console.log('Your Safe has been deployed:')
    // console.log(`https://goerli.etherscan.io/address/${safeAddress}`)
    // console.log(`https://app.safe.global/gor:${safeAddress}`)
}

async function sendEth(safeSdk: any) {

    const safeAddress = await safeSdk.getAddress()

    const safeAmount = ethers.utils.parseUnits('0.01', 'ether').toHexString()

    const transactionParameters = {
        to: safeAddress,
        value: safeAmount
    }

    const tx = await owner1Signer.sendTransaction(transactionParameters)

    console.log('Fundraising.')
    console.log(`Deposit Transaction: https://goerli.etherscan.io/tx/${tx.hash}`)
}

initAPIKit().catch(console.error);
createSafe().catch(console.error);
// sendEth(safeService).catch(console.error);