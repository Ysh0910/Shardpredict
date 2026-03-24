import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Contract, parseEther, formatEther } from 'ethers';
import { useApp } from '../App';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';

function TxStatus({ status, error }) {
  if (!status) return null;
  const map = {
    pending: { color:'#facc15', text:'⏳ Transaction pending…' },
    success: { color:'#4ade80', text:'✅ Transaction confirmed' },
    error:   { color:'#f87171', text:`❌ ${error}` },
  };
  const { color, text } = map[status];
  return <p style={{ color, fontSize:'0.85rem', margin:0 }}>{text}</p>;
}

export default function MarketDetail() {
  const { id } = useParams();
  const { account, provider, isOwner } = useApp();

  const [market,     setMarket]     = useState(null);
  const [onChain,    setOnChain]    = useState({ yes:'0', no:'0', resolved:false, outcome:false });
  const [amount,     setAmount]     = useState('');
  const [resolveOut, setResolveOut] = useState('true');
  const [proofUrl,   setProofUrl]   = useState('');
  const [backendProof, setBackendProof] = useState(null);
  const [txStatus,   setTxStatus]   = useState(null);
  const [txError,    setTxError]    = useState(null);

  // Load market from backend
  useEffect(() => {
    fetch('/markets')
      .then(r => r.json())
      .then(list => {
        const m = list.find(x => String(x.marketId) === String(id));
        if (m) { setMarket(m); setBackendProof(m.proof || null); }
      })
      .catch(() => {});
  }, [id]);

  const fetchOnChain = useCallback(async () => {
    if (!provider) return;
    try {
      const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const r = await c.getMarket(Number(id));
      setOnChain({ yes: formatEther(r[1]), no: formatEther(r[2]), resolved: r[3], outcome: r[4] ?? false });
    } catch (err) {
      console.error('getMarket:', err.message);
    }
  }, [provider, id]);

  useEffect(() => { fetchOnChain(); }, [fetchOnChain]);

  async function runTx(fn) {
    setTxStatus('pending'); setTxError(null);
    try {
      const tx = await fn();
      await tx.wait();
      setTxStatus('success');
      await fetchOnChain();
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err) {
      setTxError(err.message); setTxStatus('error');
    }
  }

  async function placeBet(side) {
    if (!account || !amount) return;
    const signer = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const value = parseEther(amount);
    await runTx(() => side === 'yes' ? c.betYes(Number(id), { value }) : c.betNo(Number(id), { value }));
    setAmount('');
    fetch('/users/score', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ wallet: account, points: 10 }) }).catch(() => {});
  }

  async function resolve() {
    if (!account) return;
    const signer = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await runTx(() => c.resolveMarket(Number(id), resolveOut === 'true'));
    fetch('/markets/resolve', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ marketId: Number(id), proof: proofUrl, outcome: resolveOut === 'true' }),
    }).then(r => r.json()).then(d => { if (d.proof) setBackendProof(d.proof); }).catch(() => {});
  }

  async function claim() {
    if (!account) return;
    const signer = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await runTx(() => c.claim(Number(id)));
  }

  if (!market) return <p style={{ color:'#888', padding:40, textAlign:'center' }}>Loading market…</p>;

  const yesF     = parseFloat(onChain.yes);
  const noF      = parseFloat(onChain.no);
  const total    = (yesF + noF).toFixed(4);
  const oddsYes  = yesF > 0 ? ((yesF + noF) / yesF).toFixed(2) : '—';
  const oddsNo   = noF  > 0 ? ((yesF + noF) / noF).toFixed(2)  : '—';
  const isResolved = onChain.resolved;
  const busy     = txStatus === 'pending';
  const short    = `${market.creator.slice(0,6)}…${market.creator.slice(-4)}`;

  return (
    <main style={s.main}>
      <Link to="/" style={s.back}>← Back to Markets</Link>

      <div style={s.card}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
          <h1 style={s.title}>{market.question}</h1>
          <span style={isResolved ? s.badgeR : s.badgeO}>
            {isResolved ? `Resolved: ${onChain.outcome ? 'YES' : 'NO'}` : 'Open'}
          </span>
        </div>

        <div style={s.meta}>
          <span>by {short}</span>
          <span style={s.cat}>{market.category || 'Custom'}</span>
        </div>

        {/* Pools */}
        <div style={s.poolRow}>
          <div style={s.poolBox}>
            <p style={s.poolLabel}>YES Pool</p>
            <p style={s.poolYes}>{onChain.yes} SHM</p>
          </div>
          <div style={s.poolBox}>
            <p style={s.poolLabel}>NO Pool</p>
            <p style={s.poolNo}>{onChain.no} SHM</p>
          </div>
          <div style={s.poolBox}>
            <p style={s.poolLabel}>Total Pool</p>
            <p style={s.poolTot}>{total} SHM</p>
          </div>
        </div>

        {/* Odds */}
        <div style={s.oddsRow}>
          <span style={s.oddsYes}>If you bet 1 SHM on YES → earn {oddsYes} SHM</span>
          <span style={s.oddsNo}>If you bet 1 SHM on NO → earn {oddsNo} SHM</span>
        </div>

        {/* Betting */}
        {!isResolved && (
          <div style={s.section}>
            <p style={s.sectionLabel}>Place Bet</p>
            <div style={s.betRow}>
              <input
                type="number" placeholder="Amount (SHM)" min="0" step="0.001"
                value={amount} onChange={e => setAmount(e.target.value)}
                disabled={!account || busy} style={s.input}
              />
              <button style={s.btnYes} onClick={() => placeBet('yes')} disabled={!account || busy || !amount}>
                {busy ? '…' : 'Bet YES'}
              </button>
              <button style={s.btnNo} onClick={() => placeBet('no')} disabled={!account || busy || !amount}>
                {busy ? '…' : 'Bet NO'}
              </button>
            </div>
          </div>
        )}

        {/* Resolve — owner only */}
        {!isResolved && isOwner && (
          <div style={s.section}>
            <p style={s.sectionLabel}>Resolve Market</p>
            <div style={s.resolveRow}>
              <select value={resolveOut} onChange={e => setResolveOut(e.target.value)} disabled={busy} style={s.select}>
                <option value="true">YES</option>
                <option value="false">NO</option>
              </select>
              <input
                type="url" placeholder="Proof URL (optional)"
                value={proofUrl} onChange={e => setProofUrl(e.target.value)}
                disabled={busy} style={{ ...s.input, flex:1 }}
              />
              <button style={s.btnResolve} onClick={resolve} disabled={!account || busy}>
                {busy ? '…' : 'Resolve'}
              </button>
            </div>
          </div>
        )}

        {/* Claim + Proof */}
        {isResolved && (
          <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            <button style={s.btnClaim} onClick={claim} disabled={!account || busy}>
              {busy ? '…' : '🏆 Claim Winnings'}
            </button>
            {backendProof && (
              <a href={backendProof} target="_blank" rel="noopener noreferrer" style={s.proofLink}>
                🔗 View Proof
              </a>
            )}
          </div>
        )}

        <TxStatus status={txStatus} error={txError} />
        {!account && <p style={s.hint}>Connect wallet to interact.</p>}
      </div>
    </main>
  );
}

const s = {
  main:       { maxWidth:760, margin:'0 auto', padding:'32px 20px' },
  back:       { color:'#7c6af7', textDecoration:'none', fontSize:'0.85rem', display:'inline-block', marginBottom:20 },
  card:       { background:'#16161f', border:'1px solid #2a2a3a', borderRadius:16, padding:28, display:'flex', flexDirection:'column', gap:20 },
  title:      { fontSize:'1.3rem', fontWeight:700, color:'#e2e2e2', margin:0, lineHeight:1.4 },
  meta:       { display:'flex', gap:16, color:'#666', fontSize:'0.8rem', alignItems:'center' },
  cat:        { background:'#1e1e2e', color:'#7c6af7', borderRadius:20, padding:'2px 10px', fontSize:'0.75rem', fontWeight:600 },
  poolRow:    { display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 },
  poolBox:    { background:'#0f0f17', borderRadius:10, padding:'14px 16px', textAlign:'center' },
  poolLabel:  { color:'#666', fontSize:'0.75rem', margin:'0 0 4px' },
  poolYes:    { color:'#4ade80', fontWeight:700, fontSize:'1.1rem', margin:0 },
  poolNo:     { color:'#f87171', fontWeight:700, fontSize:'1.1rem', margin:0 },
  poolTot:    { color:'#a89cf7', fontWeight:700, fontSize:'1.1rem', margin:0 },
  oddsRow:    { display:'flex', gap:16, flexWrap:'wrap' },
  oddsYes:    { color:'#4ade80', fontSize:'0.82rem', background:'#052e16', padding:'6px 12px', borderRadius:8 },
  oddsNo:     { color:'#f87171', fontSize:'0.82rem', background:'#2d0a0a', padding:'6px 12px', borderRadius:8 },
  section:    { display:'flex', flexDirection:'column', gap:8 },
  sectionLabel:{ color:'#a89cf7', fontSize:'0.8rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', margin:0 },
  betRow:     { display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' },
  resolveRow: { display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' },
  input:      { background:'#0f0f17', border:'1px solid #2a2a3a', borderRadius:8, color:'#e2e2e2', padding:'8px 12px', fontSize:'0.9rem' },
  select:     { background:'#0f0f17', border:'1px solid #2a2a3a', borderRadius:8, color:'#e2e2e2', padding:'8px 12px' },
  btnYes:     { background:'#16a34a', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', cursor:'pointer', fontWeight:600 },
  btnNo:      { background:'#dc2626', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', cursor:'pointer', fontWeight:600 },
  btnResolve: { background:'#d97706', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', cursor:'pointer', fontWeight:600 },
  btnClaim:   { background:'#7c6af7', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', cursor:'pointer', fontWeight:700 },
  proofLink:  { color:'#a89cf7', fontSize:'0.9rem', textDecoration:'underline' },
  badgeO:     { background:'#14532d', color:'#4ade80', borderRadius:20, padding:'4px 12px', fontSize:'0.75rem', fontWeight:700, whiteSpace:'nowrap' },
  badgeR:     { background:'#1e1b4b', color:'#a89cf7', borderRadius:20, padding:'4px 12px', fontSize:'0.75rem', fontWeight:700, whiteSpace:'nowrap' },
  hint:       { color:'#888', fontSize:'0.8rem', margin:0 },
};
