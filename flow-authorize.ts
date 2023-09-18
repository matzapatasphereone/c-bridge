import * as fcl from "@onflow/fcl";
import { SHA3} from "sha3"
import { ec as EC } from "elliptic";

const ec = new EC("secp256k1");
const KEY_ID = 0;

const flowSignMessage = (message: any, privateKey: string) => {
    const key = ec.keyFromPrivate(Buffer.from(privateKey, "hex"));
    const sig = key.sign(hashMessage(message)); // hashMsgHex -> hash
    const n = 32;
    const r = sig.r.toArrayLike(Buffer, "be", n);
    const s = sig.s.toArrayLike(Buffer, "be", n);
    return Buffer.concat([r, s]).toString("hex");
};

const hashMessage = (message: any) => {
    const sha = new SHA3(256);
    sha.update(Buffer.from(message, "hex"));
    return sha.digest();

};

export const flowAuthorize = async (
    account: any,
    address: string,
    privateKey: string
) => {
    console.log("flowAuthorize", account, address, privateKey)

    return {
        ...account,
        tempId: `${address}-${KEY_ID}`,
        addr: fcl.sansPrefix(address), // the address of the signatory
        keyId: Number(KEY_ID),
        signingFunction: async (signable: any) => {
            return {
                addr: fcl.withPrefix(address),
                keyId: Number(KEY_ID),
                signature: flowSignMessage(signable.message, privateKey)
            };
        }
    };
};