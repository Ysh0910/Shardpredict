import { useState, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

export function useWallet() {
  const [account, setAccount]   = useState(null);
  const [provider, setProvider] = useState(null);
  const [error, setError]       = useState(null);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install it to continue.');
      return;
    }
    try {
      const _provider = new BrowserProvider(window.ethereum);
      const accounts  = await _provider.send('eth_requestAccounts', []);
      setProvider(_provider);
      setAccount(accounts[0]);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { account, provider, connect, error };
}
