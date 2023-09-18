import * as fcl from "@onflow/fcl";
import * as t from "@onflow/types";
import { getFlowTokensPath } from "./get-token-flow-path";

const FLOW_RPC = process.env.FLOW_QUICKNODE_RPC as string;

fcl.config().put("accessNode.api", FLOW_RPC);

const getUserVaults = async (address: string) => {
    // Define la transacción de lectura
    const response = await fcl.send([
        fcl.script`
            pub struct Entry {
                pub let path: StoragePath
                pub let type: Type
                init(path: StoragePath, type: Type) {
                    self.path = path
                    self.type = type
                }
            }
            pub fun main(address: Address): [Entry] {
                let data: [Entry] = []
                let account = getAuthAccount(address)
                account.forEachStored(fun (path: StoragePath, type: Type): Bool {
                    data.append(Entry(path: path, type: type))
                    return true
                })
                return data
            }
        `,
        fcl.args([fcl.arg(address, t.Address)]),
    ]);
    const vaults = await fcl.decode(response);
    console.log("User Vaults:", vaults);
    // const balances: { vaultPath: string; balance: number }[] = [];
    for (const vault of vaults) {
        getBalanceForVault(vault.path.identifier, address);
    }
};

// Función para obtener el balance de un vault específico
const getBalanceForVault = async (identifier: string, address: string) => {
    const tokenMetadata = await getFlowTokensPath(identifier);
    if (!tokenMetadata) return;
    const { tokenAddress, contractName, publicPath } = tokenMetadata;
    try {
        const response = await fcl.send([
            fcl.script`
                import FungibleToken from 0xf233dcee88fe0abe
                import ${contractName} from ${tokenAddress}
                
                pub fun main(account: Address): UFix64 {
                    let vaultRef = getAccount(account)
                        .getCapability(${publicPath})
                        .borrow<&${contractName}.Vault{FungibleToken.Balance}>()
                            ?? panic("Could not borrow Balance reference to the Vault")
                    return vaultRef.balance
                }
            `,
            fcl.args([fcl.arg(address, t.Address)]),
        ]);
        const balance = await fcl.decode(response);
        console.log(`Balance de ${identifier}: ${balance}`);
    } catch (error) {
        console.log("Error Getting Balance for Vault:", contractName)
    }
};


getUserVaults("0x2ab3795316e19c35");