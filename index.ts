import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import { SafeFactory, SafeAccountConfig, EthersAdapter } from '@safe-global/protocol-kit'
import dotenv from 'dotenv'

dotenv.config()

// Contract ABI
const abi = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"contract GnosisSafeProxy","name":"proxy","type":"address"},{"indexed":false,"internalType":"address","name":"singleton","type":"address"}],"name":"ProxyCreation","type":"event"},{"inputs":[{"internalType":"address","name":"_singleton","type":"address"},{"internalType":"bytes","name":"initializer","type":"bytes"},{"internalType":"uint256","name":"saltNonce","type":"uint256"}],"name":"calculateCreateProxyWithNonceAddress","outputs":[{"internalType":"contract GnosisSafeProxy","name":"proxy","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"singleton","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"createProxy","outputs":[{"internalType":"contract GnosisSafeProxy","name":"proxy","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_singleton","type":"address"},{"internalType":"bytes","name":"initializer","type":"bytes"},{"internalType":"uint256","name":"saltNonce","type":"uint256"},{"internalType":"contract IProxyCreationCallback","name":"callback","type":"address"}],"name":"createProxyWithCallback","outputs":[{"internalType":"contract GnosisSafeProxy","name":"proxy","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_singleton","type":"address"},{"internalType":"bytes","name":"initializer","type":"bytes"},{"internalType":"uint256","name":"saltNonce","type":"uint256"}],"name":"createProxyWithNonce","outputs":[{"internalType":"contract GnosisSafeProxy","name":"proxy","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"proxyCreationCode","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"proxyRuntimeCode","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"pure","type":"function"}];
// Input data from the error message
const data = '0x1688f0b90000000000000000000000003e5c63644e683549055b9be8653de26e0b4cd36e0000000000000000000000000000000000000000000000000000000000000060b1073742015cbcf5a3a4d9d1ae33ecf619439710b89475f92e2abd2117e90f900000000000000000000000000000000000000000000000000000000000000164b63e800d0000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000f48f2b2d2a534e402487b3ee7c18c33aec0fe5e40000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000d1b9177cb774bde9756631cbf567a6d7e039b4fc000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'; // Replace with your input data
const iface = new ethers.utils.Interface(abi);
const decoded = iface.parseTransaction({ data });

// Define an interface for safeSdk
interface SafeSdk {
    getAddress: () => Promise<string>;
}

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
    //the entire tx object
    console.log(decoded);
    //signer address and blance
    try {
        const signerAddress = await ethAdapterOwner1.getSignerAddress();
        if (typeof signerAddress !== 'string') {
            throw new Error('Signer address is undefined');
        }
        console.log(`Signer address: ${signerAddress}`);
        const balance = await provider.getBalance(signerAddress);
        console.log(`Signer balance: ${ethers.utils.formatEther(balance)} ETH`);
    } catch (error) {
        console.error('Failed to get signer address or balance:', error);
    }
}

// Check if address is a contract
async function isContractDeployed(address: string): Promise<boolean> {
    try {
        const code = await provider.getCode(address);
        const isDeployed = code !== "0x";
        console.log(`Contract deployed at ${address}: ${isDeployed}`);
        return isDeployed;
    } catch (error) {
        console.error(`Error checking contract deployment at ${address}:`, error);
        return false;
    }
}


async function initAPIKit() {
    const txServiceUrl = 'https://safe-transaction-goerli.safe.global'
    const safeService = new SafeApiKit({ txServiceUrl, ethAdapter: ethAdapterOwner1 })
    // return safeService
    // console.log(safeService)
}


async function createSafe(): Promise<SafeSdk | null> {
    const address = "0xa6B71E26C5e0845f74c812102Ca7114b6a896A32"; // Replace with the address calculated by the CREATE2 opcode
    if (await isContractDeployed(address)) {
        console.log(`A contract already exists at address ${address}`);
        return null;
    }

    const safeFactory = await SafeFactory.create({ ethAdapter: ethAdapterOwner1 });
    const ownerAddress = await owner1Signer.getAddress();
    const safeAccountConfig: SafeAccountConfig = { owners: [ownerAddress], threshold: 1 };

    try {
        console.log('Deploying Safe...');
        const safeSdkOwner1 = await safeFactory.deploySafe({ safeAccountConfig });
        const safeAddress = await safeSdkOwner1.getAddress();

        console.log(`Safe deployed at address: ${safeAddress}`);
        console.log(`View on Etherscan: https://goerli.etherscan.io/address/${safeAddress}`);
        console.log(`View on Gnosis Safe: https://app.safe.global/gor:${safeAddress}`);

        return safeSdkOwner1;
    } catch (error) {
        console.error('Failed to deploy safe:', error);
        return null;
    }
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
// isContractDeployed('0x3e5c63644e683549055b9be8653de26e0b4cd36e')

// Handle as promises
// initAPIKit().then(() => {
//     return createSafe();
// }).then((safeSdk) => {
//     return sendEth(safeSdk);
// }).catch(console.error);