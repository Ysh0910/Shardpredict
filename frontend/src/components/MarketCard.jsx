import { useState, useEffect, useCallback } from 'react';
import { Contract, parseEther, formatEther } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';

// tx status: null | 'pending' | 'success' | 'error'
function TxStatus({ status, error }) {
  if (!status) return null;
  const map = {
    pending: { color: '#facc15', text: '⏳ Transaction pending…' },
    success: { color: '#4ade80', text: '✅ Transaction confirmed' },
    error:   { color: '#f87171', text: `❌ ${error}` },
  };
  const s = map[status];
  return <p style={{ fontSize: '0.8rem', color: s.color, margin: 0 }}>{s.text}</p>;
}

export default function MarketCard({ market, provider, account, isOwner }) {
  const [marketData, setMarketData] = useState({ yes: '0', no: '0', resolved: false, outcome: false });
  const [amount,     setAmount]     = useState('');
  const [resolveOut, setResolveOut] = useState('true');
  const [proofUrl,   setProofUrl]   = useState('');
  const [txStatus,   setTxStatus]   = useState(null);
  const [txError,    setTxError]    = useState(null);

  // Merge on-chain resolved state with backend proof
  const [backendProof, setBackendProof] = useState(market.proof || null);

  const fetchMarket = useCallback(async () => {
    if (!provider) return;
    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const r = await contract.getMarket(market.marketId);
      setMarketData({
        yes:      formatEther(r[1]),
        no:       formatEther(r[2]),
        resolved: r[3],
        outcome:  r[4] ?? false,
      });
    } catch (err) {
      console.error('getMarket error:', err.message);
    }
  }, [provider, market.marketId]);

  useEffect(() => { fetchMarket(); }, [fetchMarket]);

  async function runTx(fn) {
    setTxStatus('pending');
    setTxError(null);
    try {
      const tx = await fn();
      await tx.wait();
      setTxStatus('success');
      await fetchMarket();
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err) {
      setTxError(err.message);
      setTxStatus('error');
    }
  }

  function getSigner() {
    return provider.getSigner();
  }

  async function placeBet(side) {
    if (!account || !amount) return;
    const signer   = await getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const value    = parseEther(amount);
    await runTx(() =>
      side === 'yes'
        ? contract.betYes(market.marketId, { value })
        : contract.betNo(market.marketId,  { value })
    );
    setAmount('');
    // +10 reputation for placing a bet
    fetch('/users/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: account, points: 10 }),
    }).catch(() => {});
  }

  async function resolve() {
    if (!account) return;
    const signer   = await getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await runTx(() => contract.resolveMarket(market.marketId, resolveOut === 'true'));
    // Store proof in backend
    fetch('/markets/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId: market.marketId, proof: proofUrl, outcome: resolveOut === 'true' }),
    })
      .then(r => r.json())
      .then(data => { if (data.proof) setBackendProof(data.proof); })
      .catch(() => {});
  }

  async function claim() {
    if (!account) return;
    const signer   = await getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await runTx(() => contract.claim(market.marketId));
  }

  const short     = `${market.creator.slice(0, 6)}…${market.creator.slice(-4)}`;
  const totalPool = (parseFloat(marketData.yes) + parseFloat(marketData.no)).toFixed(4);
  const isResolved = marketData.resolved;
  const busy = txStatus === 'pending';

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={styles.question}>{market.question}</p>
        <span style={isResolved ? styles.badgeResolved : styles.badgeOpen}>
          {isResolved ? `Resolved: ${marketData.outcome ? 'YES' : 'NO'}` : 'Open'}
        </span>
      </div>

      <p style={styles.meta}>by {short}</p>

      {/* Pools */}
      <div style={styles.pools}>
        <span style={styles.yes}>✅ YES: {marketData.yes} SHM</span>
        <span style={styles.no}>❌ NO: {marketData.no} SHM</span>
        <span style={styles.total}>Total: {totalPool} SHM</span>
      </div>

      {/* Betting — disabled when resolved */}
      {!isResolved && (
        <div style={styles.betRow}>
          <input
            type="number"
            placeholder="Amount (SHM)"
            min="0"
            step="0.001"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            disabled={!account || busy}
            style={{ maxWidth: 130 }}
          />
          <button style={styles.btnYes} onClick={() => placeBet('yes')} disabled={!account || busy || !amount}>
            {busy ? '…' : 'Bet YES'}
          </button>
          <button style={styles.btnNo} onClick={() => placeBet('no')} disabled={!account || busy || !amount}>
            {busy ? '…' : 'Bet NO'}
          </button>
        </div>
      )}

      {/* Resolve — owner only */}
      {!isResolved && isOwner && (
        <div style={styles.resolveRow}>
          <select
            value={resolveOut}
            onChange={e => setResolveOut(e.target.value)}
            disabled={!account || busy}
            style={styles.select}
          >
            <option value="true">YES</option>
            <option value="false">NO</option>
          </select>
          <input
            type="url"
            placeholder="Proof URL (optional)"
            value={proofUrl}
            onChange={e => setProofUrl(e.target.value)}
            disabled={busy}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button style={styles.btnResolve} onClick={resolve} disabled={!account || busy}>
            {busy ? '…' : 'Resolve Market'}
          </button>
        </div>
      )}

      {/* Claim + Proof link */}
      {isResolved && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={styles.btnClaim} onClick={claim} disabled={!account || busy}>
            {busy ? '…' : '🏆 Claim Winnings'}
          </button>
          {backendProof && (
            <a href={backendProof} target="_blank" rel="noopener noreferrer" style={styles.proofLink}>
              🔗 View Proof
            </a>
          )}
        </div>
      )}

      {/* Tx feedback */}
      <TxStatus status={txStatus} error={txError} />

      {!account && <p style={styles.hint}>Connect wallet to interact.</p>}
    </div>
  );
}

const styles = {
  card:          { background:'#16161f', border:'1px solid #2a2a3a', borderRadius:12, padding:20, display:'flex', flexDirection:'column', gap:12 },
  question:      { fontSize:'1rem', fontWeight:600, color:'#e2e2e2', margin:0, flex:1, marginRight:8 },
  meta:          { fontSize:'0.75rem', color:'#666', margin:0 },
  pools:         { display:'flex', gap:16, flexWrap:'wrap' },
  yes:           { color:'#4ade80', fontSize:'0.85rem', fontWeight:600 },
  no:            { color:'#f87171', fontSize:'0.85rem', fontWeight:600 },
  total:         { color:'#a89cf7', fontSize:'0.85rem', fontWeight:600 },
  betRow:        { display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' },
  resolveRow:    { display:'flex', gap:8, alignItems:'center' },
  btnYes:        { background:'#16a34a', color:'#fff', borderRadius:6, border:'none', padding:'6px 12px', cursor:'pointer' },
  btnNo:         { background:'#dc2626', color:'#fff', borderRadius:6, border:'none', padding:'6px 12px', cursor:'pointer' },
  btnResolve:    { background:'#d97706', color:'#fff', borderRadius:6, border:'none', padding:'6px 12px', cursor:'pointer' },
  btnClaim:      { background:'#7c6af7', color:'#fff', borderRadius:6, border:'none', padding:'8px 16px', cursor:'pointer', fontWeight:600 },
  select:        { background:'#1e1e2e', color:'#e2e2e2', border:'1px solid #2a2a3a', borderRadius:6, padding:'6px 8px' },
  badgeOpen:     { background:'#14532d', color:'#4ade80', borderRadius:20, padding:'2px 10px', fontSize:'0.75rem', fontWeight:600, whiteSpace:'nowrap' },
  badgeResolved: { background:'#1e1b4b', color:'#a89cf7', borderRadius:20, padding:'2px 10px', fontSize:'0.75rem', fontWeight:600, whiteSpace:'nowrap' },
  hint:          { color:'#888', fontSize:'0.75rem', margin:0 },
  proofLink:     { color:'#a89cf7', fontSize:'0.85rem', textDecoration:'underline' },
};
