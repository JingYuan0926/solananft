import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const WalletButton = () => {
  return (
    <WalletMultiButtonDynamic className="px-4 py-2 rounded border border-gray-300" />
  );
};

export default WalletButton; 