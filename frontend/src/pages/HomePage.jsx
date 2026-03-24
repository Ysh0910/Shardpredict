import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Contract, formatEther } from 'ethers';
import { useApp } from '../App';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';

const CATEGORIES = ['All', 'Cricket', 'Politics', 'Tech', 'Custom'];

function MarketSummaryCard({ market }) {
  const { provider } = useApp();
  const [pools, setPools] = useState({ yes: '0', no: '0', resolved: false, outcome: false });

  useEffect(() => {
    if (!provider) return;
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    c.getMarket(market.marketId)
      .then(r => setPools({ yes: formatEther(r[1]), no: formatEther(r[2]), resolved: r[3], outcome: r[4] ?? false }))
      .catch(() => {});
  }, [provider, market.marketId]);

  const total = (parseFloat(pools.yes) + parseFloat(pools.no)).toFixed(4);
  const isResolved = pools.resolved;

  return (
    <div style={s.card}>
      {market.image && (
        <img src={market.image} alt="" style={s.img} onError={e => { e.target.style.display = 'none'; }} />
      )}
      <div style={s.cardBody}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
          <p style={s.question}>{market.question}</p>
          <span style={isResolved ? s.badgeR : s.badgeO}>
            {isResolved ? `✓ ${pools.outcome ? 'YES' : 'NO'}` : 'Open'}
          </span>
        </div>
        <span style={s.cat}>{market.category || 'Custom'}</span>
        <div style={s.pools}>
          <span style={s.yes}>YES {pools.yes} SHM</span>
          <span style={s.no}>NO {pools.no} SHM</span>
          <span style={s.tot}>Total {total} SHM</span>
        </div>
        <Link to={`/market/${market.marketId}`} style={s.viewBtn}>View Market →</Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [markets,  setMarkets]  = useState([]);
  const [category, setCategory] = useState('All');
  const [err,      setErr]      = useState(null);

  const load = useCallback(() => {
    fetch('/markets')
      .then(r => r.json())
      .then(d => { setMarkets(d); setErr(null); })
      .catch(() => setErr('Failed to load markets'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = category === 'All'
    ? markets
    : markets.filter(m => (m.category || 'Custom') === category);

  return (
    <main style={s.main}>
      {/* Category tabs */}
      <div style={s.tabs}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{ ...s.tab, ...(category === c ? s.tabActive : {}) }}
          >
            {c}
          </button>
        ))}
      </div>

      {err && <p style={s.err}>{err}</p>}

      {filtered.length === 0 && !err && (
        <p style={s.empty}>No markets in this category yet.</p>
      )}

      <div style={s.grid}>
        {filtered.map(m => <MarketSummaryCard key={m._id} market={m} />)}
      </div>
    </main>
  );
}

const s = {
  main:    { maxWidth:1100, margin:'0 auto', padding:'32px 20px' },
  tabs:    { display:'flex', gap:8, marginBottom:28, flexWrap:'wrap' },
  tab:     { background:'#1e1e2e', color:'#888', border:'1px solid #2a2a3a', borderRadius:20, padding:'6px 18px', cursor:'pointer', fontSize:'0.85rem', transition:'all .15s' },
  tabActive:{ background:'#7c6af7', color:'#fff', borderColor:'#7c6af7' },
  grid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:20 },
  card:    { background:'#16161f', border:'1px solid #2a2a3a', borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column', transition:'border-color .15s, transform .15s', cursor:'pointer' },
  img:     { width:'100%', height:140, objectFit:'cover' },
  cardBody:{ padding:18, display:'flex', flexDirection:'column', gap:10, flex:1 },
  question:{ fontSize:'0.95rem', fontWeight:600, color:'#e2e2e2', margin:0, lineHeight:1.4 },
  cat:     { fontSize:'0.72rem', color:'#7c6af7', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' },
  pools:   { display:'flex', gap:12, flexWrap:'wrap' },
  yes:     { color:'#4ade80', fontSize:'0.8rem', fontWeight:600 },
  no:      { color:'#f87171', fontSize:'0.8rem', fontWeight:600 },
  tot:     { color:'#a89cf7', fontSize:'0.8rem', fontWeight:600 },
  badgeO:  { background:'#14532d', color:'#4ade80', borderRadius:20, padding:'2px 10px', fontSize:'0.7rem', fontWeight:700, whiteSpace:'nowrap' },
  badgeR:  { background:'#1e1b4b', color:'#a89cf7', borderRadius:20, padding:'2px 10px', fontSize:'0.7rem', fontWeight:700, whiteSpace:'nowrap' },
  viewBtn: { marginTop:'auto', background:'#7c6af7', color:'#fff', borderRadius:8, padding:'8px 14px', textDecoration:'none', fontSize:'0.85rem', fontWeight:600, textAlign:'center', display:'block' },
  err:     { color:'#f87171', marginBottom:16 },
  empty:   { color:'#555', fontSize:'0.9rem' },
};
