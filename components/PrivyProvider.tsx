// Updated PrivyProvider.tsx to enable embedded wallet creation on login

<<<<<<< Updated upstream
import React from 'react';
import { usePrivy } from 'privy-react';

const PrivyProvider = () => {
    const { createWallet } = usePrivy();

    const handleLogin = async () => {
        try {
            // Create an embedded wallet on login
            await createWallet();
            console.log('Embedded wallet created successfully!');
        } catch (error) {
            console.error('Error creating embedded wallet:', error);
        }
    };

    return (
        <div>
            <button onClick={handleLogin}>Login and Create Wallet</button>
        </div>
    );
};

export default PrivyProvider;
=======
export default function NullPayPrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#6C63FF',
          landingHeader: 'Enter NullPay',
          loginMessage: 'No seed phrase. No complexity.',
        },
        loginMethods: ['email', 'google'],
        embeddedWallets: {
          ethereum: { createOnLogin: 'users' }, // ✅ FIXED: Create wallet on signup
        },
      }}
    >
      {children}
    </PrivyProvider>
  )
}
>>>>>>> Stashed changes
