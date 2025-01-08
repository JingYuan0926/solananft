import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { Metaplex, walletAdapterIdentity, bundlrStorage } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, PublicKey, Keypair } from "@solana/web3.js";
import WalletButton from "../components/WalletButton";

export default function Home() {
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const [loading, setLoading] = useState(false);

  const mintNFT = async () => {
    if (!connected) return;

    try {
      setLoading(true);
      console.log("Starting NFT minting process...");
      
      const connection = new Connection(clusterApiUrl("devnet"));
      const metaplex = new Metaplex(connection);
      
      // Configure Metaplex with wallet and bundlr storage
      metaplex.use(walletAdapterIdentity(wallet));
      metaplex.use(bundlrStorage({
        address: 'https://devnet.bundlr.network',
        providerUrl: 'https://api.devnet.solana.com',
        timeout: 60000,
      }));

      // Generate a new mint account
      const mintKeypair = Keypair.generate();
      console.log("Generated mint address:", mintKeypair.publicKey.toBase58());

      const imageUrl = "https://miro.medium.com/v2/resize:fit:1199/1*0rjK35h3sJE_W3z4pGIQOA.jpeg";

      // Prepare metadata
      const { uri } = await metaplex.nfts().uploadMetadata({
        name: "My Solana NFT",
        description: "A beautiful NFT on Solana",
        image: imageUrl,
        properties: {
          files: [{
            uri: imageUrl,
            type: "image/jpeg"
          }]
        }
      });
      
      console.log("Metadata uploaded to:", uri);

      console.log("Creating NFT...");
      // Create NFT with the uploaded metadata URI
      const { nft } = await metaplex.nfts().create({
        uri,
        name: "My Solana NFT",
        sellerFeeBasisPoints: 500,
        mintAddress: mintKeypair.publicKey,
        keypair: mintKeypair,
        tokenOwner: publicKey,
      });

      console.log("NFT created successfully!");
      console.log("Mint address:", nft.address.toBase58());
      console.log("Metadata address:", nft.metadataAddress.toBase58());
      
      alert(`NFT minted successfully! View it at: https://explorer.solana.com/address/${nft.address}?cluster=devnet`);
    } catch (error) {
      console.error("Error minting NFT:", error);
      alert("Error minting NFT: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl mb-8">Solana NFT Minter</h1>
      
      <WalletButton />
      
      {connected && (
        <button
          onClick={mintNFT}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? "Minting..." : "Mint NFT"}
        </button>
      )}
    </div>
  );
}
