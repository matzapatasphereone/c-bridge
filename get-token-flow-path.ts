import axios from "axios";

const tokensListULR =
  "https://cdn.jsdelivr.net/gh/FlowFans/flow-token-list/src/tokens/flow-mainnet.tokenlist.json";

export const getFlowTokensPath = async (
  identifier: string
): Promise<{
  tokenAddress: string;
  contractName: string;
  publicPath: string;
} | null> => {
  const tokensListULR =
    "https://cdn.jsdelivr.net/gh/FlowFans/flow-token-list@main/src/tokens/flow-mainnet.tokenlist.json";
  const response = await axios.get(tokensListULR);
  const tokensList = response.data.tokens;
  const searchedToken = tokensList.find((token: any) =>
    token.path.vault.includes(identifier)
  );
  if (!searchedToken) return null;
  return {
    tokenAddress: searchedToken.address,
    contractName: searchedToken.contractName,
    publicPath: searchedToken.path.balance,
  };
};

const getSupportedTokens = async () => {
  const response = await axios.get(tokensListULR);
  const tokensList = response.data.tokens;
  // Array that contains address/chain/decimals/logoUri/name/symbol for each token
  const supportedTokens: {
    address: string;
    chainId: string;
    decimals: number;
    logoURI: string;
    name: string;
    symbol: string;
  }[] = [];
  tokensList.forEach((token: any) => {
    supportedTokens.push({
      address: token.address,
      chainId: "FLOW",
      decimals: token.decimals,
      logoURI: token.logoURI,
      name: token.name,
      symbol: token.symbol,
    });
  });
};


const getFlowTokensMetadata = async (address: string) => {
  const tokenGetResponse = await axios.get(tokensListULR);
  const tokensList = tokenGetResponse.data.tokens;
  // Find Token wich address equals to the address passed as parameter
  const tokenMetadata = tokensList.find((token: any) =>
    token.address.includes(address)
  );
  return {
    name: tokenMetadata.name,
    symbol: tokenMetadata.symbol,
    decimals: tokenMetadata.decimals,
  };
};




