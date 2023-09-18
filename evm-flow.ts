import "dotenv/config"
import { ethers, BigNumber } from "ethers"

// Transactions
// MATIC -> MATIC (flow) via UI
// First step -> open vault for token
// https://polygonscan.com/tx/0x36edcadfdb7113aa7637c35c2ada4a674bbdb9781a4f250cf394b59ca34483eb
// https://flowscan.org/transaction/e546d83044e02410a12634114ed93dcca1842ad9a341d3aa5d87da478e36e780


async function evmToFlowNative({
    contract_address,
    private_key,
    provider_url,
    amount,
    to_chain_id,
    to_address,
}: {
    contract_address: string,
    private_key: string,
    provider_url: string,
    amount: string,
    to_chain_id: number,
    to_address: string
}) {
    const provider = new ethers.providers.JsonRpcProvider(provider_url);
    const wallet = new ethers.Wallet(private_key, provider);
    const cBridgeContract = new ethers.Contract(contract_address, [
        "function depositNative(uint256 _amount, uint64 _mintChainId, address _mintAccount, uint64 _nonce) external payable returns (bytes32)"
    ], wallet);

    const nonce = Date.now()  // Nonce is timestamp as per https://cbridge-docs.celer.network/developer/api-reference/contract-pool-based-transfer
    console.log("nonce", nonce);
    const tx = await cBridgeContract.depositNative(
        BigNumber.from(amount),
        to_chain_id,
        to_address,
        nonce,
        {
            value: BigNumber.from(amount), // This should match amount for bnb minimum is 0.01
            // gasPrice: ethers.utils.parseEther("0.000000139437606192") // POLYGON
            gasPrice: ethers.utils.parseEther(".000000003") // BSC
        }
    );
    await tx.wait();

    return tx.hash;
}

// MATIC
// evmToFlowNative({
//     contract_address: "0xc1a2d967dfaa6a10f3461bc21864c23c1dd51eea",
//     private_key: "...",
//     provider_url: 'https://polygon-mainnet.g.alchemy.com/v2/...',
//     amount: "1000000000000000000",
//     to_chain_id: 12340001,
//     to_address: "0x0000000000000000000000005B3109DEe582145b",
// }).then(console.log)
    

// BNB
// https://bscscan.com/tx/0x388ff18fb2c75bb129010e881746a69127a73ddb660956187c7de1e6a56191cd
// evmToFlowNative({
//     contract_address: "0x78bc5Ee9F11d133A08b331C2e18fE81BE0Ed02DC",
//     private_key: "...",
//     provider_url: 'https://purple-alpha-breeze.bsc.quiknode.pro/.../',
//     amount: "12000000000000000",
//     to_chain_id: 12340001,
//     to_address: "0x0000000000000000000000002ab3795316e19c35",
// }).then(console.log)



