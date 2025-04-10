var web3;

async function Connect()
{

await window.web3.currentProvider.enable();
web3=new Web3(window.web3.currentProvider);
}

    async function connectWallet() {
        try {
            // Check if MetaMask is installed
            if (typeof window.ethereum === "undefined") {
                alert("MetaMask is not installed. Please install it to use this feature.");
                return;
            }

            // Request account access
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

            // Log the connected account
            console.log("Connected account:", accounts[0]);
            alert(`Wallet connected: ${accounts[0]}`);
        } catch (error) {
            console.error("Error connecting wallet:", error);
            alert("Failed to connect wallet. Please try again.");
        }
    }

