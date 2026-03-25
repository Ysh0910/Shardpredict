import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Contract, parseEther, formatEther } from "ethers";
import { motion } from "framer-motion";
import { useApp } from "../App";
import { apiUrl } from "../api";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../contract";

const CATEGORY_GRADIENTS = {
  Cricket: "from-emerald-900 to-green-950",
  Politics: "from-blue-900 to-slate-950",
  Tech: "from-violet-900 to-indigo-950",
  Custom: "from-slate-800 to-slate-950",
};

function TxStatus({ status, error }) {
  if (!status) return null;
  const cfg = {
    pending: { border: "border-gold",    text: "text-gold",    msg: "Transaction pending..." },
    success: { border: "border-yes",     text: "text-yes",     msg: "Transaction confirmed!" },
    error:   { border: "border-no",      text: "text-no",      msg: error || "Transaction failed" },
  }[status];
  return (
    <div className={`glass-card border-l-4 ${cfg.border} p-3 text-sm font-mono ${cfg.text}`}>
      {cfg.msg}
    </div>
  );
}

function VerificationBadge({ status }) {
  if (!status) return null;
  const cfg = {
    verified:  { cls: "bg-yes/10 border-yes/30 text-yes",  icon: "âœ“", label: "AI Verified" },
    disputed:  { cls: "bg-no/10 border-no/30 text-no",     icon: "âš ", label: "Disputed by AI" },
    verifying: { cls: "bg-gold/10 border-gold/30 text-gold", icon: null, label: "AI Verifying..." },
  }[status];
  if (!cfg) return null;
  return (
    <span className={`border rounded-full px-3 py-1 text-sm font-mono flex items-center gap-2 ${cfg.cls}`}>
      {cfg.icon
        ? <span>{cfg.icon}</span>
        : <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
      }
      {cfg.label}
    </span>
  );
}

export default function MarketDetail() {
  const { id } = useParams();
  const { account, provider, isOwner } = useApp();
  const [market,       setMarket]       = useState(null);
  const [onChain,      setOnChain]      = useState({ yes:"0", no:"0", resolved:false, outcome:false });
  const [resolveOut,   setResolveOut]   = useState("true");
  const [proofUrl,     setProofUrl]     = useState("");
  const [backendProof, setBackendProof] = useState(null);
  const [txStatus,     setTxStatus]     = useState(null);
  const [txError,      setTxError]      = useState(null);
  const [betSide,      setBetSide]      = useState("yes");
  const [amount,       setAmount]       = useState("");
  const [challenging,  setChallenging]  = useState(false);
  const [challengeMsg, setChallengeMsg] = useState(null);

  const loadMarket = () => {
    fetch(apiUrl("/markets")).then(r => r.json()).then(list => {
      const m = list.find(x => String(x.marketId) === String(id));
      if (m) { setMarket(m); setBackendProof(m.proof || null); }
    }).catch(() => {});
  };

  useEffect(() => { loadMarket(); }, [id]);

  const fetchOnChain = useCallback(async () => {
    if (!provider) return;
    try {
      const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const r = await c.getMarket(Number(id));
      setOnChain({ yes: formatEther(r[1]), no: formatEther(r[2]), resolved: r[3], outcome: r[4] ?? false });
    } catch (err) { console.error("getMarket:", err.message); }
  }, [provider, id]);

  useEffect(() => { fetchOnChain(); }, [fetchOnChain]);

  async function runTx(fn) {
    setTxStatus("pending"); setTxError(null);
    try {
      const tx = await fn(); await tx.wait();
      setTxStatus("success"); await fetchOnChain();
      setTimeout(() => setTxStatus(null), 3000);
    } catch (err) { setTxError(err.message); setTxStatus("error"); }
  }

  async function placeBet() {
    if (!account || !amount) return;
    const signer = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await runTx(() => betSide === "yes"
      ? c.betYes(Number(id), { value: parseEther(amount) })
      : c.betNo(Number(id),  { value: parseEther(amount) }));
    setAmount("");
    fetch(apiUrl("/users/score"), { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ wallet: account, points: 10 }) }).catch(() => {});
  }

  async function resolve() {
    if (!account) return;
    const signer = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await runTx(() => c.resolveMarket(Number(id), resolveOut === "true"));
    fetch(apiUrl("/markets/resolve"), { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ marketId: Number(id), proof: proofUrl, outcome: resolveOut === "true" }) })
      .then(r => r.json()).then(d => { if (d.proof) setBackendProof(d.proof); }).catch(() => {});
  }

  async function claim() {
    if (!account) return;
    const signer = await provider.getSigner();
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    await runTx(() => c.claim(Number(id)));
  }

  async function challengeResolution() {
    if (!account) return;
    setChallenging(true); setChallengeMsg(null);
    try {
      const res = await fetch(`${API}/markets/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketId: Number(id), wallet: account }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChallengeMsg({
        type: "success",
        text: data.verificationTriggered
          ? `Challenge recorded! Threshold reached (${data.challengeCount}/${data.threshold}). AI verification in progress...`
          : `Challenge recorded (${data.challengeCount}/${data.threshold}). ${data.threshold - data.challengeCount} more needed.`,
      });
      setTimeout(() => loadMarket(), 1000);
    } catch (err) {
      setChallengeMsg({ type: "error", text: err.message });
    } finally {
      setChallenging(false);
    }
  }

  // All hooks must be before any early return
  const yesF = parseFloat(onChain.yes);
  const noF  = parseFloat(onChain.no);
  const total = (yesF + noF).toFixed(4);
  const oddsYes = yesF > 0 ? ((yesF + noF) / yesF).toFixed(2) : null;
  const oddsNo  = noF  > 0 ? ((yesF + noF) / noF).toFixed(2)  : null;
  const yesPct  = (yesF + noF) > 0 ? Math.round((yesF / (yesF + noF)) * 100) : 50;
  const isResolved = onChain.resolved;
  const busy = txStatus === "pending";

  const _amt = parseFloat(amount);
  const _pool = betSide === "yes" ? yesF : noF;
  const potentialReturn = (amount && !isNaN(_amt) && _pool > 0)
    ? ((_amt * (yesF + noF)) / _pool).toFixed(4)
    : null;

  if (!market) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  const cat  = market.category || "Custom";
  const grad = CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.Custom;
  const short = `${market.creator.slice(0,6)}...${market.creator.slice(-4)}`;
  const alreadyChallenged = market?.challenges?.some(c => c.wallet?.toLowerCase() === account?.toLowerCase());
  const challengeCount = market?.challenges?.length || 0;

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <Link to="/" className="text-primary text-sm font-mono hover:opacity-75 transition mb-6 inline-block">
        back to markets
      </Link>

      {/* Hero */}
      <div className="relative h-56 overflow-hidden rounded-2xl mb-6">
        {market.image
          ? <img src={market.image} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display="none"; }} />
          : <div className={`w-full h-full bg-gradient-to-br ${grad}`} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-base to-transparent" />
        <div className="absolute bottom-4 left-5 right-24">
          <h1 className="font-display text-2xl font-bold text-white leading-tight">{market.question}</h1>
        </div>
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          <span className="bg-elevated/80 text-primary border border-primary/30 rounded-full px-2 py-0.5 text-xs font-mono backdrop-blur-sm">{cat}</span>
          {isResolved
            ? <span className="bg-gold/10 border border-gold/30 text-gold rounded-full px-2 py-0.5 text-xs font-mono">Resolved: {onChain.outcome ? "YES" : "NO"}</span>
            : <span className="bg-yes/10 border border-yes/30 text-yes rounded-full px-2 py-0.5 text-xs flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yes animate-pulse" />OPEN</span>
          }
        </div>
      </div>

      <p className="text-secondary text-xs font-mono mb-6">by {short}</p>

      {/* Pool stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label:"YES Pool", val:onChain.yes, cls:"border-yes", textCls:"text-yes" },
          { label:"NO Pool",  val:onChain.no,  cls:"border-no",  textCls:"text-no"  },
          { label:"Total",    val:total,        cls:"border-primary", textCls:"text-primary" },
        ].map(({ label, val, cls, textCls }, i) => (
          <motion.div key={label} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.1 + i*0.05 }}
            className={`glass-card p-4 border-l-4 ${cls}`}>
            <p className="text-secondary text-xs font-mono uppercase tracking-widest mb-1">{label}</p>
            <p className={`font-display text-3xl font-bold ${textCls}`}>{parseFloat(val).toFixed(4)}</p>
            <p className="text-secondary text-xs font-mono">SHM</p>
          </motion.div>
        ))}
      </div>

      {/* Probability bar */}
      <div className="glass-card p-5 mb-6">
        <div className="flex justify-between text-sm font-mono mb-2">
          <span className="text-yes">YES {yesPct}%</span>
          <span className="text-secondary text-xs">probability</span>
          <span className="text-no">NO {100-yesPct}%</span>
        </div>
        <div className="h-6 rounded-full overflow-hidden flex bg-elevated">
          <motion.div className="h-full bg-yes" style={{ boxShadow:"0 0 12px rgba(0,230,118,0.4)" }}
            initial={{ width:0 }} animate={{ width:`${yesPct}%` }} transition={{ duration:0.8, ease:"easeOut" }} />
          <motion.div className="h-full bg-no" style={{ boxShadow:"0 0 12px rgba(255,61,87,0.4)" }}
            initial={{ width:0 }} animate={{ width:`${100-yesPct}%` }} transition={{ duration:0.8, ease:"easeOut" }} />
        </div>
        <p className="text-yes text-xs font-mono mt-2">{yesPct}% chance this resolves YES</p>
      </div>

      {/* Bet slip */}
      {!isResolved && (
        <div className="glass-card p-6 mb-6">
          <h2 className="font-display text-lg font-semibold text-white mb-4">Place Bet</h2>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <motion.button whileTap={{ scale:0.97 }} onClick={() => setBetSide("yes")}
              className={`p-4 rounded-xl border-2 font-display font-semibold text-sm transition-all duration-200 ${
                betSide === "yes" ? "border-yes bg-yes/5 text-yes" : "border-primary/20 glass-card text-secondary hover:border-yes/40"
              }`}
              style={betSide === "yes" ? { boxShadow:"0 0 20px rgba(0,230,118,0.25)" } : {}}>
              BET YES
            </motion.button>
            <motion.button whileTap={{ scale:0.97 }} onClick={() => setBetSide("no")}
              className={`p-4 rounded-xl border-2 font-display font-semibold text-sm transition-all duration-200 ${
                betSide === "no" ? "border-no bg-no/5 text-no" : "border-primary/20 glass-card text-secondary hover:border-no/40"
              }`}
              style={betSide === "no" ? { boxShadow:"0 0 20px rgba(255,61,87,0.25)" } : {}}>
              BET NO
            </motion.button>
          </div>
          <input type="number" placeholder="0.0 SHM" min="0" step="0.001"
            value={amount} onChange={e => setAmount(e.target.value)}
            disabled={!account || busy} className="input-dark mb-3 text-lg" />
          <div className="flex gap-2 mb-5">
            {["0.1","0.5","1","5"].map(v => (
              <button key={v} onClick={() => setAmount(v)}
                className="bg-elevated hover:bg-primary/20 text-secondary hover:text-white font-mono text-xs px-3 py-1.5 rounded-lg transition-all duration-150">
                {v}
              </button>
            ))}
          </div>
          {potentialReturn && (
            <div className="glass-card bg-primary/5 border-primary/20 p-4 mb-5">
              <p className="text-secondary text-xs font-mono uppercase tracking-widest mb-1">Potential Return</p>
              <p className="font-display text-2xl font-bold text-primary">{potentialReturn} SHM</p>
            </div>
          )}
          {(oddsYes || oddsNo) && (
            <div className="flex gap-3 mb-5">
              {oddsYes && <div className="glass-card p-3 flex-1 text-center">
                <p className="text-secondary text-xs font-mono mb-1">1 SHM on YES earns</p>
                <p className="text-yes font-mono font-bold">{oddsYes} SHM</p>
              </div>}
              {oddsNo && <div className="glass-card p-3 flex-1 text-center">
                <p className="text-secondary text-xs font-mono mb-1">1 SHM on NO earns</p>
                <p className="text-no font-mono font-bold">{oddsNo} SHM</p>
              </div>}
            </div>
          )}
          <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
            onClick={placeBet} disabled={!account || busy || !amount}
            className={`w-full py-3 rounded-xl font-display text-lg font-bold text-base transition-all duration-200 ${
              betSide === "yes" ? "bg-gradient-to-r from-yes to-emerald-500" : "bg-gradient-to-r from-no to-rose-700"
            }`}>
            {busy ? "Pending..." : `Confirm Bet ${betSide.toUpperCase()}`}
          </motion.button>
          {!account && <p className="text-secondary text-xs text-center mt-3 font-mono">Connect wallet to place bets</p>}
        </div>
      )}

      {/* Claim */}
      {isResolved && (
        <motion.div
          animate={{ boxShadow: ["0 0 0px rgba(0,230,118,0)", "0 0 25px rgba(0,230,118,0.4)", "0 0 0px rgba(0,230,118,0)"] }}
          transition={{ repeat:Infinity, duration:1.5, repeatType:"reverse" }}
          className="mb-6"
        >
          <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
            onClick={claim} disabled={!account || busy}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-yes to-teal-400 font-display text-xl font-bold text-base">
            {busy ? "..." : "Claim Winnings"}
          </motion.button>
          {backendProof && (
            <a href={backendProof} target="_blank" rel="noopener noreferrer"
              className="block text-center text-primary text-sm font-mono mt-3 hover:opacity-75 transition">
              View Proof
            </a>
          )}
        </motion.div>
      )}

      {/* AI Verification & Challenge */}
      {isResolved && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-white">Resolution Verification</h2>
            <VerificationBadge status={market?.verificationStatus} />
          </div>

          {market?.verificationResult && (
            <div className={`glass-card p-4 mb-4 border-l-4 ${
              market.verificationStatus === "verified" ? "border-yes" :
              market.verificationStatus === "disputed" ? "border-no" : "border-gold"
            }`}>
              <p className="text-sm text-secondary font-mono mb-1">AI Analysis:</p>
              <p className="text-white text-sm">{market.verificationResult}</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <span className="text-secondary text-sm font-mono">
              {challengeCount} challenge{challengeCount !== 1 ? "s" : ""} submitted
            </span>
            {(!market?.verificationStatus || market?.verificationStatus === "pending") && (
              <span className="text-xs text-secondary font-mono">Need 3 for AI verification</span>
            )}
          </div>

          {!alreadyChallenged && account && (
            <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
              onClick={challengeResolution} disabled={challenging}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 font-display font-bold text-base text-sm border border-amber-500/30">
              {challenging ? "Submitting..." : "Challenge This Resolution"}
            </motion.button>
          )}

          {alreadyChallenged && (
            <div className="glass-card bg-gold/5 border-gold/20 p-3 text-center">
              <p className="text-gold text-sm font-mono">You have already challenged this market</p>
            </div>
          )}

          {challengeMsg && (
            <div className={`glass-card p-3 mt-3 border-l-4 ${challengeMsg.type === "success" ? "border-yes text-yes" : "border-no text-no"}`}>
              <p className="text-sm font-mono">{challengeMsg.text}</p>
            </div>
          )}

          {!account && <p className="text-secondary text-xs text-center mt-3 font-mono">Connect wallet to challenge</p>}
        </div>
      )}

      {/* Owner resolve */}
      {!isResolved && isOwner && (
        <div className="glass-card border border-gold/20 bg-gold/5 p-5 mb-6">
          <p className="font-display text-gold font-semibold mb-4">Admin: Resolve Market</p>
          <div className="flex gap-3 mb-4">
            <button onClick={() => setResolveOut("true")}
              className={`flex-1 py-2.5 rounded-xl font-display font-semibold text-sm border-2 transition-all ${
                resolveOut === "true" ? "border-yes bg-yes/10 text-yes" : "border-primary/20 text-secondary hover:border-yes/40"
              }`}>Resolve YES</button>
            <button onClick={() => setResolveOut("false")}
              className={`flex-1 py-2.5 rounded-xl font-display font-semibold text-sm border-2 transition-all ${
                resolveOut === "false" ? "border-no bg-no/10 text-no" : "border-primary/20 text-secondary hover:border-no/40"
              }`}>Resolve NO</button>
          </div>
          <input type="url" placeholder="Proof URL (optional)" value={proofUrl} onChange={e => setProofUrl(e.target.value)}
            disabled={busy} className="input-dark mb-3" />
          <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.98 }}
            onClick={resolve} disabled={!account || busy}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 font-display font-bold text-base text-sm">
            {busy ? "..." : `Confirm Resolve ${resolveOut === "true" ? "YES" : "NO"}`}
          </motion.button>
        </div>
      )}

      {txStatus && <TxStatus status={txStatus} error={txError} />}
    </main>
  );
}




