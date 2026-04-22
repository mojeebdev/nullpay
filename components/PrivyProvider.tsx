// Updated PrivyProvider.tsx to enable embedded wallet creation on login

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