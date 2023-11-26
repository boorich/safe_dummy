import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import { SafeFactory, SafeAccountConfig, EthersAdapter } from '@safe-global/protocol-kit'
import dotenv from 'dotenv'

dotenv.config()

// https://chainlist.org/?search=goerli&testnets=true
const RPC_URL = 'https://eth-goerli.public.blastapi.io'
const provider = new ethers.providers.JsonRpcProvider(RPC_URL)

// Initialize signer(s) here
const owner1Signer = new ethers.Wallet(process.env.OWNER_1_PRIVATE_KEY!, provider)

const ethAdapterOwner1 = new EthersAdapter({
    ethers,
    signerOrProvider: owner1Signer
})
// log all fields of the adapter
async function logAdapter() {
    try {
        const signerAddress = await ethAdapterOwner1.getSignerAddress();
        console.log(`Signer address: ${signerAddress}`);
    } catch (error) {
        console.error('Failed to get signer address:', error);
    }
}

// Check if address is a contract
async function isContractDeployed(address: string): Promise<boolean> {
    const code = await provider.getCode(address);
    return code !== "0x";
}

// Define an interface for safeSdk
interface SafeSdk {
    getAddress: () => Promise<string>;
}

async function initAPIKit() {
    const txServiceUrl = 'https://safe-transaction-goerli.safe.global'
    const safeService = new SafeApiKit({ txServiceUrl, ethAdapter: ethAdapterOwner1 })
    return safeService
    // console.log(safeService)
}


async function createSafe(): Promise<SafeSdk> {
    const address = "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2"; // Replace with the address calculated by the CREATE2 opcode
    const contractExists = await isContractDeployed(address);
    if (contractExists) {
        console.log(`A contract already exists at address ${address}`);
    } else {
        console.log(`No contract exists at address ${address}`);
    }
    const safeFactory = await SafeFactory.create({ ethAdapter: ethAdapterOwner1 })
    const safeAccountConfig: SafeAccountConfig = {
        owners: [
            await owner1Signer.getAddress(),
        ],
        threshold: 1,
        // ... (Optional params)
    }

    try {
        console.log('Deploying Safe...')
        const safeSdkOwner1 = await safeFactory.deploySafe({ safeAccountConfig })
        console.log('Safe deployed.')
        const safeAddress = await safeSdkOwner1.getAddress()
        console.log('Safe address is: ', safeAddress)
        return safeSdkOwner1;
    } catch (error) {
        console.log('Failed to deploy safe:', error)
        throw error;
    }
    // console.log('Your Safe has been deployed:')
    // console.log(`https://goerli.etherscan.io/address/${safeAddress}`)
    // console.log(`https://app.safe.global/gor:${safeAddress}`)
}

async function sendEth(safeSdk: SafeSdk) {
    const safeAddress = await safeSdk.getAddress()

    const safeAmount = ethers.utils.parseUnits('0.01', 'ether').toHexString()

    const transactionParameters = {
        to: safeAddress,
        value: safeAmount,
        gasLimit: ethers.utils.hexlify(50000) // Optional, maybe works without this
    }

    const tx = await owner1Signer.sendTransaction(transactionParameters)

    console.log('Fundraising.')
    console.log(`Deposit Transaction: https://goerli.etherscan.io/tx/${tx.hash}`)
}

initAPIKit()
logAdapter()
createSafe()
// Handle promises
// initAPIKit().then(() => {
//     return createSafe();
// }).then((safeSdk) => {
//     return sendEth(safeSdk);
// }).catch(console.error);