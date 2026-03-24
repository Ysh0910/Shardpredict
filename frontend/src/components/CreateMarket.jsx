import React, { useState } from 'react';

export default function CreateMarket({ provider, account, onCreated }) {
  const [question, setQuestion] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const { Contract } = await import('ethers');
      const { CONTRACT_ADDRESS, CONTRACT_ABI } = await import('../contract');

      const signer   = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx      = await contract.createMarket(question);
      await tx.wait();

      // createMarket emits no event and has no return value,
      // so we derive the new marketId from marketCount after the tx confirms.
      // Shardeum markets are 0-indexed: new id = marketCount - 1
      const count   = await contract.marketCount();
      const marketId = Number(count) - 1;

      const res = await fetch('/markets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ marketId, question, creator: account }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Backend error ${res.status}`);
      }

      setQuestion('');
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Create Market</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Ask a yes/no question…"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          disabled={!account || loading}
        />
        <button
          type="submit"
          style={styles.btn}
          disabled={!account || loading || !question.trim()}
        >
          {loading ? 'Creating…' : 'Create Market'}
        </button>
      </form>
      {!account && <p style={styles.hint}>Connect your wallet to create a market.</p>}
      {error    && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  card:    { background:'#16161f', border:'1px solid #2a2a3a', borderRadius:12, padding:24, marginBottom:32 },
  heading: { marginBottom:16, color:'#a89cf7', fontSize:'1rem', fontWeight:700 },
  form:    { display:'flex', gap:10 },
  btn:     { background:'#7c6af7', color:'#fff', whiteSpace:'nowrap' },
  hint:    { marginTop:10, color:'#888', fontSize:'0.8rem' },
  error:   { marginTop:10, color:'#f87171', fontSize:'0.85rem' },
};
