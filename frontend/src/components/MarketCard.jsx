import { useState, useEffect, useCallback } from 'react';
import { Contract, parseEther, formatEther } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';
import '../styles/market-card.css';

function TxStatus({ status, error }) {
  if (!status) return null;
  const cls = { pending: 'mc__tx-pending', success: 'mc__tx-success', error: 'mc__tx-error' }[status];
  const txt = { pending: '⏳ Transaction pending…', success: '✅ Transaction confirmed', error: `❌ ${error}` }[status];
  return <div className={cls}>{txt}</div>;
}

export default function MarketCard({ market, provider, account, isOwner }) {
  const [marketData,   setMarketData]   = useState({ yes:'0', no:'0', resolved:false, outcome:false });
  const [amount,       setAmount]       = useState('');
  const [resolveOut,   setResolveOut]   = useState('true');
  const [proofUrl,     setProofUrl]     = useState('');
  const [txStatus,     setTxStatus]     = useState(null);
  const [txError,      setTxError]      = useState(null);
  const [backendProof, setBackendProof] = useState(market.proof || null);

  const fetchMarket = useCallback(async () => {
    if (!provider) return;
    try {
      const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const r = await c.getMarket(market.marketId);
      setMarketData({ yes: formatEther(r[1]), no: formatEther(r[2]), resolved: r[3], outcome: r[4] ?? false });
    } catch (err) { console.error('getMarket error:', err.message); }
  }, [provider, market.marketId]);

  useEffect(() => { fetchMarket(); }, [fetchMarket]);

  async function runTx(fn) {
    setTxStatus('pending'); setTxError(null);
    try {
      const tx = await fn(); await tx.wait();
      setTxStatus('success'); await fetchMarket();
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err) { setTxError(err.message); setTxStatus('error'); }
  }

  async function placeBet(side) {
    if (!account || !amount) return;
    const signer = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await runTx(() => side === 'yes'
      ? c.betYes(market.marketId, { value: parseEther(amount) })
      : c.betNo(market.marketId,  { value: parseEther(amount) }));
    setAmount('');
    fetch('/users/score', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ wallet: account, points: 10 }) }).catch(() => {});
  }

  async function resolve() {
    if (!account) return;
    const signer = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await runTx(() => c.resolveMarket(market.marketId, resolveOut === 'true'));
    fetch('/markets/resolve', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ marketId: market.marketId, proof: proofUrl, outcome: resolveOut === 'true' }) })
      .then(r => r.json()).then(d => { if (d.proof) setBackendProof(d.proof); }).catch(() => {});
  }

  async function claim() {
    if (!account) return;
    const signer = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await runTx(() => c.claim(market.marketId));
  }

  const short      = `${market.creator.slice(0,6)}…${market.creator.slice(-4)}`;
  const totalPool  = (parseFloat(marketData.yes) + parseFloat(marketData.no)).toFixed(4);
  const yesF       = parseFloat(marketData.yes);
  const noF        = parseFloat(marketData.no);
  const yesPct     = (yesF + noF) > 0 ? Math.round((yesF / (yesF + noF)) * 100) : 50;
  const isResolved = marketData.resolved;
  const busy       = txStatus === 'pending';

  return (
    <div className="mc">
      <div className="mc__header">
        <p className="mc__question">{market.question}</p>
        <span className={isResolved ? 'mc__badge-resolved' : 'mc__badge-open'}>
          {isResolved ? `✓ ${marketData.outcome ? 'YES' : 'NO'}` : '● Open'}
        </span>
      </div>

      <p className="mc__meta">by {short}</p>

      <div className="mc__pool-row">
        <div className="mc__pool-box mc__pool-box--yes">
          <p className="mc__pool-label">YES Pool</p>
          <p className="mc__pool-val mc__pool-val--yes">{marketData.yes}</p>
          <p className="mc__pool-unit">SHM</p>
        </div>
        <div className="mc__pool-box mc__pool-box--no">
          <p className="mc__pool-label">NO Pool</p>
          <p className="mc__pool-val mc__pool-val--no">{marketData.no}</p>
          <p className="mc__pool-unit">SHM</p>
        </div>
        <div className="mc__pool-box mc__pool-box--tot">
          <p className="mc__pool-label">Total</p>
          <p className="mc__pool-val mc__pool-val--tot">{totalPool}</p>
          <p className="mc__pool-unit">SHM</p>
        </div>
      </div>

      <div>
        <div className="mc__bar-wrap">
          <div className="mc__bar-yes" style={{ width: `${yesPct}%` }} />
          <div className="mc__bar-no"  style={{ width: `${100 - yesPct}%` }} />
        </div>
        <div className="mc__bar-labels">
          <span className="mc__bar-label-yes">YES {yesPct}%</span>
          <span className="mc__bar-label-no">NO {100 - yesPct}%</span>
        </div>
      </div>

      {!isResolved && (
        <div className="mc__bet-row">
          <input className="mc__input" type="number" placeholder="Amount (SHM)" min="0" step="0.001"
            value={amount} onChange={e => setAmount(e.target.value)} disabled={!account || busy} />
          <button className="mc__btn-yes" onClick={() => placeBet('yes')} disabled={!account || busy || !amount}>
            {busy ? '…' : 'Bet YES'}
          </button>
          <button className="mc__btn-no" onClick={() => placeBet('no')} disabled={!account || busy || !amount}>
            {busy ? '…' : 'Bet NO'}
          </button>
        </div>
      )}

      {!isResolved && isOwner && (
        <div className="mc__resolve-box">
          <p className="mc__resolve-label">⚙️ Resolve Market</p>
          <div className="mc__resolve-row">
            <select className="mc__select" value={resolveOut} onChange={e => setResolveOut(e.target.value)} disabled={!account || busy}>
              <option value="true">YES</option>
              <option value="false">NO</option>
            </select>
            <input className="mc__input" type="url" placeholder="Proof URL (optional)"
              value={proofUrl} onChange={e => setProofUrl(e.target.value)} disabled={busy} />
            <button className="mc__btn-resolve" onClick={resolve} disabled={!account || busy}>
              {busy ? '…' : 'Resolve'}
            </button>
          </div>
        </div>
      )}

      {isResolved && (
        <div className="mc__claim-row">
          <button className="mc__btn-claim" onClick={claim} disabled={!account || busy}>
            {busy ? '…' : '🏆 Claim Winnings'}
          </button>
          {backendProof && <a href={backendProof} target="_blank" rel="noopener noreferrer" className="mc__proof-link">🔗 View Proof</a>}
        </div>
      )}

      {txStatus && <TxStatus status={txStatus} error={txError} />}
      {!account && <p className="mc__hint">Connect wallet to interact.</p>}
    </div>
  );
}
