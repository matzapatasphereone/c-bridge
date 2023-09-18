import "dotenv/config"
import axios from "axios"
import { ethers, BigNumber } from "ethers"

// Transactions
// MATIC -> MATIC (flow) via UI
// First step -> open vault for token
// https://polygonscan.com/tx/0x36edcadfdb7113aa7637c35c2ada4a674bbdb9781a4f250cf394b59ca34483eb
// https://flowscan.org/transaction/e546d83044e02410a12634114ed93dcca1842ad9a341d3aa5d87da478e36e780

async function getTimeEstimation(src_chain_id: number, dst_chain_id: number) {
    return (await axios.get(`https://cbridge-prod2.celer.app/v2/getLatest7DayTransferLatencyForQuery?src_chain_id=${src_chain_id}&dst_chain_id=${dst_chain_id}`)).data
}

async function getAmountEstimation(src_chain_id: number, dst_chain_id: number, token_symbol: string, amount: string, slippage_tolerance = 3000) {
    return (await axios.get(`https://cbridge-prod2.celer.app/v2/estimateAmt?src_chain_id=${src_chain_id}&dst_chain_id=${dst_chain_id}&token_symbol=${token_symbol}&amt=${amount}&slippage_tolerance=${slippage_tolerance}`)).data
}

async function gerTransactionsHistory(src_address: string, dst_address: string) {
    return (await axios.get(`https://cbridge-prod2.celer.app/v1/transferHistory?acct_addr[]=${src_address}&acct_addr[]=${dst_address}&page_size=10`)).data
}

async function getTransactionStatus(transfer_id: string) {
    const statusMap = {
        0: "TRANSFER_UNKNOWN",
        1: "TRANSFER_SUBMITTING",
        2: "TRANSFER_FAILED",
        3: "TRANSFER_WAITING_FOR_SGN_CONFIRMATION",
        4: "TRANSFER_WAITING_FOR_FUND_RELEASE",
        5: "TRANSFER_COMPLETED",
        6: "TRANSFER_TO_BE_REFUNDED",
        7: "TRANSFER_REQUESTING_REFUND",
        8: "TRANSFER_REFUND_TO_BE_CONFIRMED",
        9: "TRANSFER_CONFIRMING_YOUR_REFUND",
        10: "TRANSFER_REFUNDED",
        11: "TRANSFER_DELAYED"

    }

    const code = (await axios.request({
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://cbridge-prod2.celer.app/v2/getTransferStatus',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({ transfer_id })
    })).data.status

    return {
        status: statusMap[code],
        code: code
    }

}

async function depositNative(contract_address: string, private_key: string, provider_url: string, amount: string, to_chain_id: number, to_address: string) {
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
            value: ethers.utils.parseEther("1.0"),
            gasPrice: ethers.utils.parseEther("0.000000139437606192")
        }
    );
    await tx.wait();

    console.log('Transaction Hash:', tx.hash);
}

async function generateTransferId() {
    const transfer_id = ethers.utils.solidityKeccak256(
        [
            "address",
            "address",
            "address",
            "uint256",
            "uint64",
            "uint64",
            "uint64"
        ],
        [
            "0xc5da449d051c1338a3c2aaf2b6c739d06abe2508", /// User's wallet address, 
            "0xc5da449d051c1338a3c2aaf2b6c739d06abe2508", /// User's wallet address, 
            "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", /// Wrap token address/ ERC20 token address 
            "1000000000000000000", /// Send amount in String 
            "12340001", /// Destination chain id
            "1694731423818", /// Nonce
            "137", /// Source chain id
        ],
    )

    return transfer_id;
}

// console.log("time estimations: ", await getTimeEstimation(1, 127));
// getAmountEstimation(137, 12340001, "MATIC", "1000000000000000000").then(console.log)
gerTransactionsHistory("0xc5da449d051c1338a3c2aaf2b6c739d06abe2508", "0x2ab3795316e19c35").then(console.log)
// console.log("transactions status", await getTransactionStatus("0xccbfe803c03346f891b416174303f58784e947efaa084ad67ea3067597baef79"))
// console.log("transfer id", await generateTransferId())

// TODO:
// depositNative("0xc1a2d967dfaa6a10f3461bc21864c23c1dd51eea", private_key, 'https://polygon-mainnet.g.alchemy.com/v2/...', "1000000000000000000", 12340001, "0x0000000000000000000000005B3109DEe582145b")


// Direct pool
// To accomplished user's transfer, FE(front-end) needs to do the following things:
// - Get basic transfer configs to get correct user' input for assets transfer
// - After collecting all needed information, always get updated estimation for the transfer.
// - Check user's on-chain token allowance for cBridge contract. If the allowance is not enough for user token transfer, trigger the corresponding on-chain approve flow
// - Submit on-chain transfer request to cBridge contract on source chain
// - Get transfer status repeatedly to check whether the transfer is complete.



// Pegged
// DAI (ETH) -> DAI (Flow)
// USDT (ETH) -> USDT (Flow)
// WETH (ETH) -> WETH (Flow)
// BNB (BSC) -> BNB (Flow)
// BUSD (BSC) -> BUSD (Flow)
// MATIC (MATIC) -> MATIC (Flow)
// celrWFLOW (FLOW) -> celrWFLOW (ETH
// cfUSDC (FLOW) -> cfUSDC (ETH)

// MATIC -> MATIC
const config = {
    "org_chain_id": 137,
    "org_token": {
        "token": {
            "symbol": "MATIC",
            "address": "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
            "decimal": 18,
            "xfer_disabled": false
        },
        "name": "Matic Token",
        "icon": "https://get.celer.app/cbridge-icons/MATIC.png",
        "inbound_lmt": "",
        "inbound_epoch_cap": "",
        "transfer_disabled": false,
        "liq_add_disabled": false,
        "liq_rm_disabled": false,
        "liq_agg_rm_src_disabled": false,
        "delay_threshold": "",
        "delay_period": 0
    },
    "pegged_chain_id": 12340001,
    "pegged_token": {
        "token": {
            "symbol": "MATIC",
            "address": "A.231cc0dbbcffc4b7.ceMATIC.Vault",
            "decimal": 8,
            "xfer_disabled": false
        },
        "name": "Matic Token",
        "icon": "https://get.celer.app/cbridge-icons/MATIC.png",
        "inbound_lmt": "",
        "inbound_epoch_cap": "",
        "transfer_disabled": false,
        "liq_add_disabled": false,
        "liq_rm_disabled": false,
        "liq_agg_rm_src_disabled": false,
        "delay_threshold": "",
        "delay_period": 0
    },
    "pegged_deposit_contract_addr": "0xc1a2D967DfAa6A10f3461bc21864C23C1DD51EeA",
    "pegged_burn_contract_addr": "08dd120226ec2213",
    "canonical_token_contract_addr": "",
    "vault_version": 0,
    "bridge_version": 2,
    "migration_peg_burn_contract_addr": ""
}
