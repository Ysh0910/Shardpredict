import React from 'react';

export default function WalletBar({ account, onConnect, error, score }) {
  const short = account
    ? `${account.slice(0, 6)}…${account.slice(-4)}`
    : null;

  return (
    <div style={styles.bar}>
      <span style={styles.title}>🔮 Prediction Market</span>
      <div style={styles.right}>
        {error && <span style={styles.error}>{error}</span>}
        {account && score !== null && (
          <span style={styles.score}>⭐ {score} pts</span>
        )}
        {account
          ? <span style={styles.address}>{short}</span>
          : <button style={styles.btn} onClick={onConnect}>Connect Wallet</button>
        }
      </div>
    </div>
  );
}

const styles = {
  bar:     { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 24px', background:'#16161f', borderBottom:'1px solid #2a2a3a' },
  title:   { fontSize:'1.2rem', fontWeight:700, color:'#a89cf7' },
  right:   { display:'flex', alignItems:'center', gap:12 },
  address: { background:'#2a2a3a', padding:'6px 14px', borderRadius:20, fontSize:'0.85rem', color:'#a89cf7' },
  score:   { background:'#1e1b4b', padding:'4px 12px', borderRadius:20, fontSize:'0.8rem', color:'#facc15', fontWeight:600 },
  btn:     { background:'#7c6af7', color:'#fff' },
  error:   { color:'#f87171', fontSize:'0.8rem', maxWidth:260 },
};
