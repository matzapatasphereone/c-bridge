import "dotenv/config"
import { ethers, BigNumber } from "ethers"
import { getTransactionStatus } from "."

// Transactions
// MATIC -> MATIC (flow) via UI
// First step -> open vault for token
// https://polygonscan.com/tx/0x36edcadfdb7113aa7637c35c2ada4a674bbdb9781a4f250cf394b59ca34483eb
// https://flowscan.org/transaction/e546d83044e02410a12634114ed93dcca1842ad9a341d3aa5d87da478e36e780

const getContractAddress = (chainId) => {
    const contractMap = {
        137: "0xc1a2d967dfaa6a10f3461bc21864c23c1dd51eea",
        56: "0x78bc5Ee9F11d133A08b331C2e18fE81BE0Ed02DC"
    }

    return contractMap[chainId]
}

const getGasPrice = (chainId) => {
    const gasPriceMap = {
        137: ethers.utils.parseEther("0.000000139437606192"),
        56: ethers.utils.parseEther("0.000000003")
    }

    return gasPriceMap[chainId]
}

async function evmToFlowNative({
    tokenAddress,
    privateKey,
    providerUrl,
    amount,
    fromAddress,
    fromChainId,
    toAddress,
}: {
    tokenAddress: string;
    privateKey: string;
    providerUrl: string;
    amount: string;
    fromAddress: string;
    fromChainId: number;
    toAddress: string;
}) {
    const toChainId = 12340001; // flow chain id
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const cBridgeContract = new ethers.Contract(getContractAddress(fromChainId), [
        "function depositNative(uint256 _amount, uint64 _mintChainId, address _mintAccount, uint64 _nonce) external payable returns (bytes32)"
    ], wallet);
    const padAddress = (addr: string) => "0x" + addr.split("0x")[1].padStart(40, "0")

    const nonce = Date.now()  // Nonce is timestamp as per https://cbridge-docs.celer.network/developer/api-reference/contract-pool-based-transfer
    const tx = await cBridgeContract.depositNative(
        BigNumber.from(amount),
        toChainId,
        padAddress(toAddress),
        nonce,
        {
            value: BigNumber.from(amount), // This should match amount for bnb minimum is 0.01
            gasPrice: getGasPrice(fromChainId)
        }
    );

    // Add 0 to str to match flow address format
    const mint_id = ethers.utils.solidityKeccak256(
        [
            "address",
            "address",
            "uint256",
            "uint64",
            "address",
            "uint64",
            "uint64"
        ],
        [
            fromAddress, /// User's wallet address, 
            tokenAddress, /// selectedTokenAddress,
            amount, /// Mint amount in String 
            String(toChainId), /// Pegged Chain Id
            padAddress(toAddress), /// User's wallet address, 
            String(nonce), /// Nonce
            String(fromChainId), /// Original chain id
        ],
    )

    await tx.wait();
    return { hash: tx.hash, txid: mint_id };
}

// MATIC
// evmToFlowNative({
//     contractAddress: "0xc1a2d967dfaa6a10f3461bc21864c23c1dd51eea",
//     privateKey: "...",
//     providerUrl: 'https://polygon-mainnet.g.alchemy.com/v2/...',
//     amount: "1000000000000000000",
//     to_chain_id: 12340001,
//     toAddress: "0x0000000000000000000000005B3109DEe582145b",
// }).then(console.log)


// BNB
// https://bscscan.com/tx/0x388ff18fb2c75bb129010e881746a69127a73ddb660956187c7de1e6a56191cd
// {
//     hash: '0xc926fb85cc4f217e0886ed44c5a357ccc5821368f2e871ec11bde62212aff2a5',
//     txid: '0x44bcbd74ab76d178e16edf3b2a9347e3b66a122b4daed6f8ffa9ad49df4fe853'
// }
// evmToFlowNative({
//     privateKey: "7442a7d43e1589cde86a089581aab31bf057fde7a089dcf61199240af771a757",
//     tokenAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
//     providerUrl: process.env.BNB_RPC as string,
//     amount: "12000000000000000",
//     toAddress: "0x6062e99303ba6bd7",
//     fromAddress: "0xc5dA449D051c1338A3C2aaf2b6C739d06aBe2508",
//     fromChainId: 56,
// }).then(async ({ hash, txid }) => {
//     console.log({ hash, txid })

//     if (!txid || !hash) return;
//     let status = await getTransactionStatus(txid)
//     while (true) {
//         console.log(status)
//         if (status.code === 5) break; // tx failed
//         if (status.code === 2) break; // tx failed

//         // wait 30 seconds
//         await new Promise(resolve => setTimeout(resolve, 30000));
//     }
// })


