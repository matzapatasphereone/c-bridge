import "dotenv/config";
import * as fcl from "@onflow/fcl";
import { flowAuthorize } from "./flow-authorize";
import { sha3_256 } from "js-sha3";

const FLOW_RPC = process.env.FLOW_QUICKNODE_RPC;

fcl.config().put("accessNode.api", FLOW_RPC);

const flowToEvm = async ({
  fromAddress,
  toAddress,
  fromPrivateKey,
  fromAmount,
  tokenVault,
  toChainId
}: {
  fromAddress: string;
  fromPrivateKey: string;
  toAddress: string;
  toChainId: number;
  fromAmount: number;
  tokenVault: string;
}) => {
  // Convert Amount to FLOW units with 8 decimal places
  try {
    const nonce = Date.now()
    const transactionHash = await fcl
      .send([
        fcl.transaction`
        import FungibleToken from 0xf233dcee88fe0abe
        import PegBridge from 0x08dd120226ec2213
        
        transaction() {
          let provRef: &{FungibleToken.Provider}
        
          prepare(acct: AuthAccount) {
            self.provRef = acct.borrow<&{FungibleToken.Provider}>(from: ${tokenVault}) ?? panic("Could not borrow a reference to the owner's vault")
          }
        
          execute {
            let burnInfo = PegBridge.BurnInfo(amt: UFix64(${fromAmount}), withdrawChId: ${toChainId}, withdrawAddr: "${toAddress}", nonce: ${nonce})
            PegBridge.burn(from: self.provRef, info: burnInfo) 
          }
        }
      `,
        fcl.proposer((account: any) => flowAuthorize(account, fromAddress, fromPrivateKey)),
        fcl.payer((account: any) => flowAuthorize(account, fromAddress, fromPrivateKey)),
        fcl.authorizations([
          (account: any) => flowAuthorize(account, fromAddress, fromPrivateKey)
        ]),
        fcl.limit(9999)
      ])
      .then(fcl.decode);

    // Calculate burn id
    const user = "0x2ab3795316e19c35"; // Address as a string
    const tokStr = "A.231cc0dbbcffc4b7.ceMATIC.Vault";
    const amt = "3.00000000";
    const burnId = sha3_256(user + tokStr + amt + nonce);

    return {transactionHash, transactionId: burnId}
  } catch (e: any) {
    console.log("error", e);
    return null;
  }
};



// MATIC
// https://flowscan.org/transaction/c56b521736d24054db0e01737d94b6c5166e8568203c8e4744361206b2f570d2/script
// flowToEvm({
//   toAddress: "...",
//   fromAddress: "...",
//   fromPrivateKey: "...",
//   fromAmount: 3,
//   tokenVault: "/storage/ceMATICVault",
//   tokenAddress: "A.231cc0dbbcffc4b7.ceMATIC.Vault",
//   toChainId: 137
// }).then(console.log)


// BNB
// flowToEvm({
//   toAddress: "...",
//   fromAddress: "...",
//   fromPrivateKey: "...",
//   fromAmount: 0.015,
//   tokenVault: "/storage/ceBNBVault",
//   toChainId: 56
// }).then(console.log)
