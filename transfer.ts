import * as fcl from "@onflow/fcl";
import * as t from "@onflow/types";
import { flowAuthorize } from "./flow-authorize";
import { ethers } from "ethers";

const FLOW_RPC = process.env.FLOW_RPC as string;
const SENDER_ADDRESS = process.env.SENDER_ADDR as string;
const PRIVATE_KEY = process.env.SENDER_PRIVATE_KEY as string;
const RECIPIENT_ADDRESS = process.env.RECEIVER_ADDR as string;

fcl.config().put("accessNode.api", FLOW_RPC);

// FLOW TOKEN MAINNET 0x1654653399040a61
const sendFlow = async () => {
  const transactionHash = await fcl
    .send([
      fcl.transaction`
      import FungibleToken from 0xf233dcee88fe0abe
      import FlowToken from 0x1654653399040a61
      transaction(amount: UFix64, to: Address) {
            let sentVault: @FungibleToken.Vault
            prepare(signer: AuthAccount) {
          let vaultRef = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
          ?? panic("Could not borrow reference to the owner's Vault!")
          // Withdraw FLOW tokens from the signer's stored vault
          self.sentVault <- vaultRef.withdraw(amount: amount)
          }
        execute {
        // Get a reference to the recipient's Receiver for FLOW tokens
        let receiverRef =  getAccount(to)
            .getCapability(/public/flowTokenReceiver)
            .borrow<&{FungibleToken.Receiver}>()
      ?? panic("Could not borrow receiver reference to the recipient's Vault")
        // Deposit the withdrawn FLOW tokens in the recipient's receiver
        receiverRef.deposit(from: <-self.sentVault)
      }
      }
      `,
      fcl.args([
        fcl.arg("0.001", t.UFix64), // Amount to Transfer
        fcl.arg(RECIPIENT_ADDRESS, t.Address), // Recipient Address
      ]),
      fcl.proposer((account: any) => flowAuthorize(account, SENDER_ADDRESS, PRIVATE_KEY)),
      fcl.payer((account: any) => flowAuthorize(account, SENDER_ADDRESS, PRIVATE_KEY)),
      fcl.authorizations([
        (account: any) => flowAuthorize(account, SENDER_ADDRESS, PRIVATE_KEY),
      ]),
      fcl.limit(9999),
    ])
    .then(fcl.decode);

  console.log("Transaction Hash:", transactionHash);

  // Wait for tx to finish
  await getFlowTxStatus(transactionHash);
};

export const getFlowTxStatus = async (txHash: string) => {
  try {
    const response = await fcl.tx(txHash).onceSealed();
    console.log("Snapshot:", response);
    if (response.status === 4) {
      console.log({
        status: response.errorMessage === "" ? "SUCCESS" : "FAILURE",
        recipient: null,
      });
    } else {
      console.log({
        status: "PROCESSING",
        recipient: null,
      });
    }
    const events = response.events;
    const flowFeeEvent = events.find((event: any) =>
      event.type.includes("FeesDeducted")
    );
    console.log("Fee Event:", flowFeeEvent);
    console.log("Fee Event Data", typeof flowFeeEvent.data.amount);
    if (flowFeeEvent) {
      const feeAmount = ethers.utils.parseUnits(flowFeeEvent.data.amount, 8);
      console.log("Flow Fee Amount:", feeAmount);
    }
  } catch (error) {
    throw new Error("Error getting Tx Status on Flow:" + error);
  }
};

sendFlow();