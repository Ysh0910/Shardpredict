import { Link } from 'react-router-dom';
import { useApp } from '../App';

export default function Navbar() {
  const { account, connect, walletError, score, isOwner } = useApp();
  const short = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : null;

  return (
    <nav style={s.bar}>
      <div style={s.left}>
        <Link to="/" style={s.logo}>⚡ ShardPredict</Link>
        <Link to="/" style={s.link}>Markets</Link>
        {isOwner && <Link to="/create" style={s.link}>Create</Link>}
      </div>
      <div style={s.right}>
        {walletError && <span style={s.err}>{walletError}</span>}
        {account && score !== null && (
          <span style={s.score}>⭐ {score} pts</span>
        )}
        {account
          ? <span style={s.addr}>{short}</span>
          : <button style={s.btn} onClick={connect}>Connect Wallet</button>
        }
      </div>
    </nav>
  );
}

const s = {
  bar:   { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 28px', background:'#0f0f17', borderBottom:'1px solid #1e1e2e', position:'sticky', top:0, zIndex:100 },
  left:  { display:'flex', alignItems:'center', gap:24 },
  right: { display:'flex', alignItems:'center', gap:12 },
  logo:  { fontSize:'1.2rem', fontWeight:800, color:'#a89cf7', textDecoration:'none', letterSpacing:'-0.5px' },
  link:  { color:'#888', textDecoration:'none', fontSize:'0.9rem', transition:'color .15s' },
  addr:  { background:'#1e1e2e', padding:'6px 14px', borderRadius:20, fontSize:'0.85rem', color:'#a89cf7' },
  score: { background:'#1e1b4b', padding:'4px 12px', borderRadius:20, fontSize:'0.8rem', color:'#facc15', fontWeight:600 },
  btn:   { background:'#7c6af7', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', cursor:'pointer', fontWeight:600 },
  err:   { color:'#f87171', fontSize:'0.8rem', maxWidth:220 },
};
