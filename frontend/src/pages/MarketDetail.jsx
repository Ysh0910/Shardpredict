import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Contract, parseEther, formatEther } from 'ethers';
import { useApp } from '../App';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';
import '../styles/market-detail.css';

function TxStatus({ status, error }) {
  if (!status) return null;
  const cls = { pending:'detail__tx-pending', success:'detail__tx-success', error:'detail__tx-error' }[status];
  const txt = { pending:'⏳ Transaction pending…', success:'✅ Transaction confirmed', error:`❌ ${error}` }[status];
  return <div className={cls}>{txt}</div>;
}


function BetslipPanel({ open, onClose, onBet, busy, account }) {
  const [amount, setAmount] = useState('');
  const [side, setSide] = useState('yes');
  if (!open) return null;
  return (
    <>
      <div className="betslip-overlay" onClick={onClose} />
      <div className="betslip-panel animate-slide-in">
        <div className="betslip__header">
          <span className="betslip__title">Place Bet</span>
          <button className="betslip__close" onClick={onClose}>✕</button>
        </div>
        <div className="betslip__sides">
          <button className={`betslip__side ${side === 'yes' ? 'betslip__side--yes' : 'betslip__side--inactive'}`} onClick={() => setSide('yes')}>✅ YES</button>
          <button className={`betslip__side ${side === 'no' ? 'betslip__side--no' : 'betslip__side--inactive'}`} onClick={() => setSide('no')}>❌ NO</button>
        </div>
        <label className="betslip__label">Amount (SHM)</label>
        <input className="betslip__input" type="number" placeholder="0.00" min="0" step="0.001"
          value={amount} onChange={e => setAmount(e.target.value)} disabled={!account || busy} />
        <button
          className={`betslip__submit ${side === 'yes' ? 'betslip__submit--yes' : 'betslip__submit--no'}`}
          onClick={() => { onBet(side, amount); setAmount(''); }}
          disabled={!account || busy || !amount}
        >
          {busy ? '⏳ Pending…' : `Confirm ${side.toUpperCase()}`}
        </button>
        {!account && <p className="betslip__hint">Connect wallet first.</p>}
      </div>
    </>
  );
}


export default function MarketDetail() {
  const { id } = useParams();
  const { account, provider, isOwner } = useApp();

  const [market,       setMarket]       = useState(null);
  const [onChain,      setOnChain]      = useState({ yes: '0', no: '0', resolved: false, outcome: false });
  const [resolveOut,   setResolveOut]   = useState('true');
  const [proofUrl,     setProofUrl]     = useState('');
  const [backendProof, setBackendProof] = useState(null);
  const [txStatus,     setTxStatus]     = useState(null);
  const [txError,      setTxError]      = useState(null);
  const [betslipOpen,  setBetslipOpen]  = useState(false);

  useEffect(() => {
    fetch('/markets').then(r => r.json()).then(list => {
      const m = list.find(x => String(x.marketId) === String(id));
      if (m) { setMarket(m); setBackendProof(m.proof || null); }
    }).catch(() => {});
  }, [id]);

  const fetchOnChain = useCallback(async () => {
    if (!provider) return;
    try {
      const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const r = await c.getMarket(Number(id));
      setOnChain({ yes: formatEther(r[1]), no: formatEther(r[2]), resolved: r[3], outcome: r[4] ?? false });
    } catch (err) { console.error('getMarket:', err.message); }
  }, [provider, id]);

  useEffect(() => { fetchOnChain(); }, [fetchOnChain]);

  async function runTx(fn) {
    setTxStatus('pending'); setTxError(null);
    try {
      const tx = await fn(); await tx.wait();
      setTxStatus('success'); await fetchOnChain();
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err) { setTxError(err.message); setTxStatus('error'); }
  }

  async function placeBet(side, amount) {
    if (!account || !amount) return;
    const signer = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await runTx(() => side === 'yes'
      ? c.betYes(Number(id), { value: parseEther(amount) })
      : c.betNo(Number(id),  { value: parseEther(amount) }));
    setBetslipOpen(false);
    fetch('/users/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet: account, points: 10 }) }).catch(() => {});
  }

  async function resolve() {
    if (!account) return;
    const signer = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await runTx(() => c.resolveMarket(Number(id), resolveOut === 'true'));
    fetch('/markets/resolve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketId: Number(id), proof: proofUrl, outcome: resolveOut === 'true' }),
    }).then(r => r.json()).then(d => { if (d.proof) setBackendProof(d.proof); }).catch(() => {});
  }

  async function claim() {
    if (!account) return;
    const signer = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await runTx(() => c.claim(Number(id)));
  }

  if (!market) return (
    <div className="detail__loading"><div className="detail__spinner" /></div>
  );

  const yesF       = parseFloat(onChain.yes);
  const noF        = parseFloat(onChain.no);
  const total      = (yesF + noF).toFixed(4);
  const oddsYes    = yesF > 0 ? ((yesF + noF) / yesF).toFixed(2) : '—';
  const oddsNo     = noF  > 0 ? ((yesF + noF) / noF).toFixed(2)  : '—';
  const yesPct     = (yesF + noF) > 0 ? Math.round((yesF / (yesF + noF)) * 100) : 50;
  const isResolved = onChain.resolved;
  const busy       = txStatus === 'pending';
  const short      = `${market.creator.slice(0, 6)}…${market.creator.slice(-4)}`;

  return (
    <main className="detail animate-fade-up">
      <Link to="/" className="detail__back">← Back to Markets</Link>
      <div className="detail__card">
        <div className="detail__header">
          <h1 className="detail__title">{market.question}</h1>
          <span className={isResolved ? 'detail__badge-resolved' : 'detail__badge-open'}>
            {isResolved ? `Resolved: ${onChain.outcome ? 'YES' : 'NO'}` : '● Open'}
          </span>
        </div>
        <div className="detail__meta">
          <span className="detail__creator">👤 {short}</span>
          <span className="detail__cat">{market.category || 'Custom'}</span>
        </div>
        <div className="detail__pool-row">
          <div className="detail__pool-box detail__pool-box--yes">
            <p className="detail__pool-label">YES Pool</p>
            <p className="detail__pool-val detail__pool-val--yes">{onChain.yes}</p>
            <p className="detail__pool-unit">SHM</p>
          </div>
          <div className="detail__pool-box detail__pool-box--no">
            <p className="detail__pool-label">NO Pool</p>
            <p className="detail__pool-val detail__pool-val--no">{onChain.no}</p>
            <p className="detail__pool-unit">SHM</p>
          </div>
          <div className="detail__pool-box detail__pool-box--tot">
            <p className="detail__pool-label">Total Pool</p>
            <p className="detail__pool-val detail__pool-val--tot">{total}</p>
            <p className="detail__pool-unit">SHM</p>
          </div>
        </div>
        <div>
          <div className="detail__bar-wrap">
            <div className="detail__bar-yes" style={{ width: `${yesPct}%` }} />
            <div className="detail__bar-no"  style={{ width: `${100 - yesPct}%` }} />
          </div>
          <div className="detail__bar-labels">
            <span className="detail__bar-label-yes">YES {yesPct}%</span>
            <span className="detail__bar-label-no">NO {100 - yesPct}%</span>
          </div>
        </div>
        <div className="detail__odds-row">
          <div className="detail__odds-yes">
            <span className="detail__odds-icon">📈</span>
            <div>
              <p className="detail__odds-label">Bet 1 SHM on YES</p>
              <p className="detail__odds-val">earn {oddsYes} SHM</p>
            </div>
          </div>
          <div className="detail__odds-no">
            <span className="detail__odds-icon">📉</span>
            <div>
              <p className="detail__odds-label">Bet 1 SHM on NO</p>
              <p className="detail__odds-val">earn {oddsNo} SHM</p>
            </div>
          </div>
        </div>
        {!isResolved && (
          <button className="detail__bet-cta" onClick={() => setBetslipOpen(true)} disabled={!account || busy}>
            {account ? '💰 Place Bet' : 'Connect Wallet to Bet'}
          </button>
        )}
        {!isResolved && isOwner && (
          <div className="detail__resolve-box">
            <p className="detail__resolve-label">⚙️ Resolve Market</p>
            <div className="detail__resolve-row">
              <select className="detail__select" value={resolveOut} onChange={e => setResolveOut(e.target.value)} disabled={busy}>
                <option value="true">YES</option>
                <option value="false">NO</option>
              </select>
              <input className="detail__input" type="url" placeholder="Proof URL (optional)"
                value={proofUrl} onChange={e => setProofUrl(e.target.value)} disabled={busy} />
              <button className="detail__btn-resolve" onClick={resolve} disabled={!account || busy}>
                {busy ? '…' : 'Resolve'}
              </button>
            </div>
          </div>
        )}
        {isResolved && (
          <div className="detail__claim-row">
            <button className="detail__btn-claim" onClick={claim} disabled={!account || busy}>
              {busy ? '…' : '🏆 Claim Winnings'}
            </button>
            {backendProof && (
              <a href={backendProof} target="_blank" rel="noopener noreferrer" className="detail__proof-link">
                🔗 View Proof
              </a>
            )}
          </div>
        )}
        {txStatus && <TxStatus status={txStatus} error={txError} />}
        {!account && !isResolved && <p className="detail__hint">Connect your wallet to place bets.</p>}
      </div>
      <BetslipPanel open={betslipOpen} onClose={() => setBetslipOpen(false)} onBet={placeBet} busy={busy} account={account} />
    </main>
  );
}
