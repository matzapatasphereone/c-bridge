import "dotenv/config"
import { ethers, BigNumber } from "ethers"

// Transactions
// MATIC -> MATIC (flow) via UI
// First step -> open vault for token
// https://polygonscan.com/tx/0x36edcadfdb7113aa7637c35c2ada4a674bbdb9781a4f250cf394b59ca34483eb
// https://flowscan.org/transaction/e546d83044e02410a12634114ed93dcca1842ad9a341d3aa5d87da478e36e780


async function evmToFlowNative({
    contractAddress,
    privateKey,
    providerUrl,
    amount,
    fromAddress,
    fromChainId,
    toAddress,
}: {
    contractAddress: string,
    privateKey: string,
    providerUrl: string,
    amount: string,
    fromAddress: string;
    fromChainId: number,
    toAddress: string
}) {
    const toChainId = 12340001;
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const cBridgeContract = new ethers.Contract(contractAddress, [
        "function depositNative(uint256 _amount, uint64 _mintChainId, address _mintAccount, uint64 _nonce) external payable returns (bytes32)"
    ], wallet);

    const nonce = Date.now()  // Nonce is timestamp as per https://cbridge-docs.celer.network/developer/api-reference/contract-pool-based-transfer
    const tx = await cBridgeContract.depositNative(
        BigNumber.from(amount),
        toChainId,
        toAddress,
        nonce,
        {
            value: BigNumber.from(amount), // This should match amount for bnb minimum is 0.01
            // TODO:
            // gasPrice: ethers.utils.parseEther("0.000000139437606192") // POLYGON
            gasPrice: ethers.utils.parseEther(".000000003") // BSC
        }
    );
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
         "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", /// selectedTokenAddress,
         amount, /// Mint amount in String 
         String(toChainId), /// Pegged Chain Id
         "0x0000000000000000000000002aB3795316e19c35", /// User's wallet address, 
         String(nonce), /// Nonce
         String(fromChainId), /// Original chain id
        ],
    )

    await tx.wait();

    return {hash: tx.hash, txid: mint_id};
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
// evmToFlowNative({
//     contractAddress: "0x78bc5Ee9F11d133A08b331C2e18fE81BE0Ed02DC",
//     privateKey: "...",
//     providerUrl: 'https://purple-alpha-breeze.bsc.quiknode.pro/.../',
//     amount: "12000000000000000",
//     to_chain_id: 12340001,
//     toAddress: "0x0000000000000000000000002ab3795316e19c35",
// }).then(console.log)



