import "dotenv/config"
import axios from "axios"
import { ethers, BigNumber } from "ethers"
import { sha3_256 } from "js-sha3"

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
// gerTransactionsHistory("0xc5da449d051c1338a3c2aaf2b6c739d06abe2508", "0x2ab3795316e19c35").then(console.log)
// console.log("transactions status", await getTransactionStatus("0xccbfe803c03346f891b416174303f58784e947efaa084ad67ea3067597baef79"))
// console.log("transfer id", await generateTransferId())




// Pegged
// DAI (ETH) -> DAI (Flow)
// USDT (ETH) -> USDT (Flow)
// WETH (ETH) -> WETH (Flow)
// BNB (BSC) -> BNB (Flow)
// BUSD (BSC) -> BUSD (Flow)
// MATIC (MATIC) -> MATIC (Flow)
// celrWFLOW (FLOW) -> celrWFLOW (ETH
// cfUSDC (FLOW) -> cfUSDC (ETH)

/// Example transaction:
// {
//     transfer_id: '0x4ec14bda025a3108ed74d8fa22e7f213c8d401932b2f6b98f85d51ff1a440e82',
//     src_send_info: [Object],
//     dst_received_info: [Object],
//     ts: '1694819987745',
//     src_block_tx_link: 'https://bscscan.com/tx/0x388ff18fb2c75bb129010e881746a69127a73ddb660956187c7de1e6a56191cd',
//     dst_block_tx_link: 'https://flowscan.org/transaction/0x6e5a2ec26d056fbf895b0b3c3b560f677ca5da4e42cad68459d22589c5fff017',
//     status: 5,
//     refund_reason: 0,
//     update_ts: '1694820068808',
//     bridge_type: 2,
//     dst_deadline: '0',
//     sender: '0xc5dA449D051c1338A3C2aaf2b6C739d06aBe2508',
//     receiver: '0x0000000000000000000000002aB3795316e19c35'
// }
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
     "0xc5dA449D051c1338A3C2aaf2b6C739d06aBe2508", /// User's wallet address, 
     "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", /// selectedTokenAddress,
     "12000000000000000", /// Mint amount in String 
     "12340001", /// Pegged Chain Id
     "0x0000000000000000000000002aB3795316e19c35", /// User's wallet address, 
     "1694819940504", /// Nonce
     "56", /// Original chain id
    ],
)
console.log(mint_id)


/// Example transaction:
// {
//     transfer_id: '0xd0697b55c1cf583e6a67d1194ef97550c8e63549f8a021475e9ca42aaa23aa02',
//     src_send_info: [Object],
//     dst_received_info: [Object],
//     ts: '1694813967256',
//     src_block_tx_link: 'https://flowscan.org/transaction/0xc56b521736d24054db0e01737d94b6c5166e8568203c8e4744361206b2f570d2',
//     dst_block_tx_link: 'https://polygonscan.com/tx/0xc3fd189c01f9090a637138d32ffaca0303d958751a7edb977db660de722bf58e',
//     status: 5,
//     refund_reason: 0,
//     update_ts: '1694814501095',
//     bridge_type: 3,
//     dst_deadline: '0',
//     sender: '0x0000000000000000000000002aB3795316e19c35',
//     receiver: '0xc5dA449D051c1338A3C2aaf2b6C739d06aBe2508'
//   }
const user = "0x2ab3795316e19c35"; // Address as a string
const tokStr = "A.231cc0dbbcffc4b7.ceMATIC.Vault";
const amt = "3.00000000";
const nonce = "1694813951647";
const burnId = sha3_256(user + tokStr + amt + nonce);
console.log(burnId); 
