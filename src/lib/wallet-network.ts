/**
 * Handles network switching for mobile wallets like Brave
 * Uses wallet_addEthereumChain as fallback if network not found
 */

export const SEPOLIA_CHAIN_CONFIG = {
  chainId: "0xaa36a7", // 11155111 in hex
  chainName: "Ethereum Sepolia Testnet",
  rpcUrls: [
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
  ],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
};

export async function addAndSwitchToSepolia() {
  try {
    // Try to switch first (works on desktop)
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_CONFIG.chainId }],
    });
  } catch (switchError: any) {
    // If network not found (code 4902), add it first
    if (switchError.code === 4902) {
      try {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [SEPOLIA_CHAIN_CONFIG],
        });
        // After adding, switch to it
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_CONFIG.chainId }],
        });
      } catch (addError) {
        console.error("Failed to add Sepolia network:", addError);
        throw new Error(
          "Failed to add Sepolia network. Please add it manually in your wallet settings."
        );
      }
    } else {
      console.error("Failed to switch to Sepolia:", switchError);
      throw switchError;
    }
  }
}
