import { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Contract } from 'ethers';
import { useWallet } from './hooks/useWallet';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contract';
import Navbar        from './components/Navbar';
import HomePage      from './pages/HomePage';
import MarketDetail  from './pages/MarketDetail';
import CreateMarketPage from './pages/CreateMarketPage';

export const AppContext = createContext({});

export function useApp() { return useContext(AppContext); }

export default function App() {
  const { account, provider, connect, error: walletError } = useWallet();
  const [owner, setOwner] = useState(null);
  const [score, setScore] = useState(null);

  useEffect(() => {
    if (!provider) return;
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    c.owner().then(a => setOwner(a.toLowerCase())).catch(() => {});
  }, [provider]);

  useEffect(() => {
    if (!account) { setScore(null); return; }
    fetch(`/users/${account}`)
      .then(r => r.json())
      .then(d => setScore(d.score ?? 0))
      .catch(() => setScore(0));
  }, [account]);

  const isOwner = !!(account && owner && account.toLowerCase() === owner);

  return (
    <AppContext.Provider value={{ account, provider, connect, walletError, isOwner, score }}>
      <Navbar />
      <Routes>
        <Route path="/"           element={<HomePage />} />
        <Route path="/market/:id" element={<MarketDetail />} />
        <Route path="/create"     element={<CreateMarketPage />} />
      </Routes>
    </AppContext.Provider>
  );
}
