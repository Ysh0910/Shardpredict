import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contract } from 'ethers';
import { motion } from 'framer-motion';
import { useApp } from '../App';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';

const CATEGORIES = ['Cricket', 'Politics', 'Tech', 'Custom'];

export default function CreateMarketPage() {
  const { account, provider, isOwner } = useApp();
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('Custom');
  const [image,    setImage]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  if (!isOwner) {
    return (
      <main className="max-w-xl mx-auto px-6 py-20">
        <div className="glass-card border border-gold/20 bg-gold/5 p-12 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="font-display text-2xl text-white mb-2">Owner Access Only</h2>
          <p className="text-secondary">Only the contract owner can create prediction markets.</p>
        </div>
      </main>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true); setError(null);
    try {
      const signer   = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.createMarket(question);
      await tx.wait();
      const count    = await contract.marketCount();
      const marketId = Number(count) - 1;
      const res = await fetch('/markets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, question, creator: account, category, image: image || null }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `Backend error ${res.status}`); }
      navigate('/');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity:0, y:20 }}
        animate={{ opacity:1, y:0 }}
        className="glass-card p-8"
      >
        <h1 className="font-display text-2xl font-bold text-white mb-1">Create a Market</h1>
        <p className="text-secondary text-sm mb-8">Launch a new prediction market on Shardeum</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-secondary text-xs font-mono uppercase tracking-widest mb-2">Question</label>
            <input
              type="text" placeholder="Will X happen by Y date?"
              value={question} onChange={e => setQuestion(e.target.value)}
              disabled={loading} required
              className="input-dark"
            />
          </div>

          <div>
            <label className="block text-secondary text-xs font-mono uppercase tracking-widest mb-2">Category</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`px-4 py-2 rounded-lg font-display text-sm font-semibold transition-all duration-150 ${
                    category === c
                      ? 'bg-primary text-white'
                      : 'bg-elevated text-secondary hover:bg-primary/20 hover:text-white'
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-secondary text-xs font-mono uppercase tracking-widest mb-2">
              Image URL <span className="text-secondary/50 normal-case font-body">(optional)</span>
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="url" placeholder="https://..."
                value={image} onChange={e => setImage(e.target.value)}
                disabled={loading}
                className="input-dark flex-1"
              />
              {image && (
                <img src={image} alt="" className="w-12 h-12 rounded-lg object-cover border border-primary/20 flex-shrink-0"
                  onError={e => { e.target.style.display='none'; }} />
              )}
            </div>
          </div>

          {error && <p className="text-no text-sm font-mono">{error}</p>}

          <motion.button
            type="submit"
            whileHover={{ scale:1.01 }}
            whileTap={{ scale:0.98 }}
            disabled={loading || !question.trim()}
            className="w-full py-3 bg-gradient-to-r from-primary to-indigo-700 text-white font-display text-lg font-bold rounded-xl transition-all duration-200"
            style={{ boxShadow:'0 6px 20px rgba(91,110,245,0.3)' }}
          >
            {loading ? 'Launching...' : '🚀 Launch Market'}
          </motion.button>
        </form>
      </motion.div>
    </main>
  );
}
