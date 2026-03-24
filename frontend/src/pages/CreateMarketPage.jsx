import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Contract } from 'ethers';
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
      <main style={s.main}>
        <p style={s.denied}>Only admin can create markets.</p>
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketId, question, creator: account, category, image: image || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Backend error ${res.status}`);
      }

      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={s.main}>
      <h1 style={s.heading}>Create Market</h1>
      <form onSubmit={handleSubmit} style={s.form}>
        <label style={s.label}>Question</label>
        <input
          type="text"
          placeholder="Will X happen by Y date?"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          disabled={loading}
          style={s.input}
          required
        />

        <label style={s.label}>Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)} disabled={loading} style={s.input}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label style={s.label}>Image URL <span style={s.optional}>(optional)</span></label>
        <input
          type="url"
          placeholder="https://…"
          value={image}
          onChange={e => setImage(e.target.value)}
          disabled={loading}
          style={s.input}
        />

        {error && <p style={s.error}>{error}</p>}

        <button type="submit" style={s.btn} disabled={loading || !question.trim()}>
          {loading ? 'Creating…' : 'Create Market'}
        </button>
      </form>
    </main>
  );
}

const s = {
  main:     { maxWidth:520, margin:'60px auto', padding:'0 20px' },
  heading:  { color:'#a89cf7', fontSize:'1.4rem', fontWeight:700, marginBottom:28 },
  form:     { display:'flex', flexDirection:'column', gap:12, background:'#16161f', border:'1px solid #2a2a3a', borderRadius:16, padding:28 },
  label:    { color:'#aaa', fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:-4 },
  optional: { color:'#555', fontWeight:400, textTransform:'none' },
  input:    { background:'#0f0f17', border:'1px solid #2a2a3a', borderRadius:8, color:'#e2e2e2', padding:'10px 14px', fontSize:'0.95rem' },
  btn:      { background:'#7c6af7', color:'#fff', border:'none', borderRadius:8, padding:'12px', fontWeight:700, fontSize:'1rem', cursor:'pointer', marginTop:8 },
  error:    { color:'#f87171', fontSize:'0.85rem', margin:0 },
  denied:   { color:'#888', textAlign:'center', marginTop:60, fontSize:'1rem' },
};
