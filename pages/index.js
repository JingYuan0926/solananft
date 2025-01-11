import { useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { Metaplex, walletAdapterIdentity, bundlrStorage } from "@metaplex-foundation/js";
import { Connection, clusterApiUrl, PublicKey, Keypair } from "@solana/web3.js";
import WalletButton from "../components/WalletButton";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export default function Home() {
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [generating, setGenerating] = useState(false);

  const generateImage = async () => {
    if (!prompt) return;
    
    try {
      setGenerating(true);
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });

      setImageUrl(response.data[0].url);
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Error generating image: " + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const mintNFT = async () => {
    if (!connected || !imageUrl) return;

    try {
      setLoading(true);
      console.log("Starting NFT minting process...");
      
      const connection = new Connection(clusterApiUrl("devnet"));
      const metaplex = new Metaplex(connection);
      
      metaplex.use(walletAdapterIdentity(wallet));
      metaplex.use(bundlrStorage({
        address: 'https://devnet.bundlr.network',
        providerUrl: 'https://api.devnet.solana.com',
        timeout: 60000,
      }));

      const mintKeypair = Keypair.generate();
      console.log("Generated mint address:", mintKeypair.publicKey.toBase58());

      const { uri } = await metaplex.nfts().uploadMetadata({
        name: "AI Generated NFT",
        description: `AI-generated artwork based on prompt: ${prompt}`,
        image: imageUrl,
        properties: {
          files: [{
            uri: imageUrl,
            type: "image/png"
          }]
        }
      });
      
      console.log("Metadata uploaded to:", uri);

      console.log("Creating NFT...");
      const { nft } = await metaplex.nfts().create({
        uri,
        name: "AI Generated NFT",
        sellerFeeBasisPoints: 500,
        mintAddress: mintKeypair.publicKey,
        keypair: mintKeypair,
        tokenOwner: publicKey,
      });

      console.log("NFT created successfully!");
      console.log("Mint address:", nft.address.toBase58());
      
      alert(`NFT minted successfully! View it at: https://explorer.solana.com/address/${nft.address}?cluster=devnet`);
    } catch (error) {
      console.error("Error minting NFT:", error);
      alert("Error minting NFT: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          AI NFT Minter
        </h1>
        
        <div className="flex justify-center">
          <WalletButton />
        </div>
        
        {connected && (
          <div className="space-y-6">
            <div className="space-y-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
              />
              
              <button
                onClick={generateImage}
                disabled={generating || !prompt}
                className="w-full px-6 py-3 text-lg font-semibold bg-gradient-to-r from-green-500 to-teal-600 
                  text-white rounded-lg transition-all duration-200 transform hover:scale-105 
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {generating ? "Generating..." : "Generate Image"}
              </button>
            </div>

            {imageUrl && (
              <div className="space-y-4">
                <div className="relative aspect-square w-full rounded-lg overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt="Generated artwork"
                    className="object-cover w-full h-full"
                  />
                </div>

                <button
                  onClick={mintNFT}
                  disabled={loading}
                  className="w-full px-6 py-3 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 
                    text-white rounded-lg transition-all duration-200 transform hover:scale-105 
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Minting...</span>
                    </div>
                  ) : (
                    "Mint NFT"
                  )}
                </button>
              </div>
            )}
            
            <p className="text-sm text-gray-400 text-center">
              Connected: {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
            </p>
          </div>
        )}

        {!connected && (
          <p className="text-sm text-gray-400 text-center mt-4">
            Connect your wallet to mint NFTs
          </p>
        )}
      </div>
    </div>
  );
}
