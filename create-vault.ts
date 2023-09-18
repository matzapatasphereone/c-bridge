import "dotenv/config";
import * as fcl from "@onflow/fcl";
import { flowAuthorize } from "./flow-authorize";
import { getFlowTxStatus } from "./get-status";

const FLOW_RPC = process.env.FLOW_RPC;

fcl.config().put("accessNode.api", FLOW_RPC);

const createEmptyVault = async ({
  contractName,
  contractStorageVault,
  contractPublicReceiver,
  contractPublicBalance,
  contractAddress,
  senderAddress,
  privateKey
}) => {
  const txId = await fcl.send([
    fcl.transaction`
    import FungibleToken from 0xf233dcee88fe0abe
    import ${contractName} from ${contractAddress}
    transaction() {
        prepare(acct: AuthAccount) {
    
            if acct.borrow<&FungibleToken.Vault>(from: ${contractStorageVault}) == nil {
              acct.save(<- ${contractName}.createEmptyVault(), to: ${contractStorageVault})
            }
            acct.unlink(${contractPublicReceiver})
            acct.unlink(${contractPublicBalance})
            acct.link<&${contractName}.Vault{FungibleToken.Balance}>(${contractPublicBalance}, target: ${contractStorageVault})
            acct.link<&${contractName}.Vault{FungibleToken.Receiver}>(${contractPublicReceiver}, target: ${contractStorageVault})
    
        }
    }
    `,
    fcl.proposer((account: any) =>
      flowAuthorize(account, senderAddress, privateKey)
    ),
    fcl.payer((account: any) =>
      flowAuthorize(account, senderAddress, privateKey)
    ),
    fcl.authorizations([
      (account: any) =>
        flowAuthorize(account, senderAddress, privateKey),
    ]),
    fcl.limit(100),
  ]);
  console.log("Transaction Hash:", txId);

  // Wait for the transaction to be mined
  await getFlowTxStatus(txId);
};

// MATIC
// createEmptyVault({
//   contractAddress: "0x231cc0dbbcffc4b7",
//   contractName: "ceMATIC",
//   contractPublicBalance: "/public/ceMATICBalance",
//   contractPublicReceiver: "/public/ceMATICReceiver",
//   contractStorageVault: "/storage/ceMATICVault",
//   senderAddress: "0x2ab3795316e19c35",
//   privateKey: "...",
// })

// BNB
// createEmptyVault({
//   contractAddress: "0x231cc0dbbcffc4b7",
//   contractName: "ceBNB",
//   contractPublicBalance: "/public/ceBNBBalance",
//   contractPublicReceiver: "/public/ceBNBReceiver",
//   contractStorageVault: "/storage/ceBNBVault",
//   senderAddress: "0x2ab3795316e19c35",
//   privateKey: "...",
// })

createEmptyVault({
  contractAddress: "0x231cc0dbbcffc4b7",
  contractName: "ceBNB",
  contractPublicBalance: "/public/ceBNBBalance",
  contractPublicReceiver: "/public/ceBNBReceiver",
  contractStorageVault: "/storage/ceBNBVault",
  senderAddress: "0x6062e99303ba6bd7",
  privateKey: "be5e02c74092211448d9933b505acb3a210512a096d8400cfc20b2eb9ff01f30",
})