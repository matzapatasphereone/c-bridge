

# Flow bridge

```
import FungibleToken from 0xf233dcee88fe0abe
import PegBridge from 0x08dd120226ec2213

transaction() {
  let provRef: &{FungibleToken.Provider}

  prepare(acct: AuthAccount) {
    self.provRef = acct.borrow<&{FungibleToken.Provider}>(from: /storage/ceMATICVault) ?? panic("Could not borrow a reference to the owner's vault")
  }

  execute {
    let burnInfo = PegBridge.BurnInfo(amt: UFix64(3.06723287), withdrawChId: 137, withdrawAddr: "0xc5dA449D051c1338A3C2aaf2b6C739d06aBe2508", nonce: 1694793028431)
    PegBridge.burn(from: self.provRef, info: burnInfo) 
  }
}
```