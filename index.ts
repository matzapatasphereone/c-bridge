import "dotenv/config"
import axios from "axios"
import { ethers, BigNumber } from "ethers"
import { sha3_256 } from "js-sha3"

// Transactions
// MATIC -> MATIC (flow) via UI
// First step -> open vault for token
// https://polygonscan.com/tx/0x36edcadfdb7113aa7637c35c2ada4a674bbdb9781a4f250cf394b59ca34483eb
// https://flowscan.org/transaction/e546d83044e02410a12634114ed93dcca1842ad9a341d3aa5d87da478e36e780

export async function getTimeEstimation(src_chain_id: number, dst_chain_id: number) {
    return (await axios.get(`https://cbridge-prod2.celer.app/v2/getLatest7DayTransferLatencyForQuery?src_chain_id=${src_chain_id}&dst_chain_id=${dst_chain_id}`)).data
}

export async function getAmountEstimation(src_chain_id: number, dst_chain_id: number, token_symbol: string, amount: string, slippage_tolerance = 3000) {
    return (await axios.get(`https://cbridge-prod2.celer.app/v2/estimateAmt?src_chain_id=${src_chain_id}&dst_chain_id=${dst_chain_id}&token_symbol=${token_symbol}&amt=${amount}&slippage_tolerance=${slippage_tolerance}`)).data
}

export async function gerTransactionsHistory(src_address: string, dst_address: string) {
    return (await axios.get(`https://cbridge-prod2.celer.app/v1/transferHistory?acct_addr[]=${src_address}&acct_addr[]=${dst_address}&page_size=10`)).data
}

export async function getTransactionStatus(transfer_id: string) {
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

    try {


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
    } catch (e) {
        return {
            status: "TRANSFER_UNKNOWN",
            code: 0
        }
    }
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


