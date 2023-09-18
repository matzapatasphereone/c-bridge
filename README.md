

# Flow bridge

Important files are:
- `evm-flow` -> Bridge from evm to flow (natives only)
- `flow-evm` -> Bridge from flow to evm (back from evm-flow)
- `index` -> has some util functions like time and amount estimations, transactions history and transaction_id calculation
- `create-vault` -> when bridging to flow we need a vault before to receive the tokens. function here creates them. `get-vaults` helps to see vaults for a wallet. 
- `settings.json` has a filter to tokens supported and details about the bridge involved
- Rest of files like `flow-authorize` are still needed, but part of the server repo already.
