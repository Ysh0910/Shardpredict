import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Contract, formatEther } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../App';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract';
import { apiUrl } from '../api';

const CATEGORIES = [
  { key: 'All',      label: '🔥 All' },
  { key: 'Cricket',  label: '🏏 Cricket' },
  { key: 'Politics', label: '🗳️ Politics' },
  { key: 'Tech',     label: '💻 Tech' },
  { key: 'Custom',   label: '✨ Custom' },
];

const CATEGORY_GRADIENTS = {
  Cricket:  'from-emerald-900 to-green-950',
  Politics: 'from-blue-900 to-slate-950',
  Tech:     'from-violet-900 to-indigo-950',
  Custom:   'from-slate-800 to-slate-950',
  All:      'from-indigo-900 to-slate-950',
};

const MOCK_ACTIONS = [
  { addr:'0x3f2a…b91c', side:'YES', amt:5,   ago:2  },
  { addr:'0x8d1e…44fa', side:'NO',  amt:2.5, ago:8  },
  { addr:'0xc7b0…12de', side:'YES', amt:10,  ago:15 },
  { addr:'0x1a9f…77bc', side:'NO',  amt:1,   ago:22 },
  { addr:'0x5e3d…c0a1', side:'YES', amt:3,   ago:31 },
];

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function MarketCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="h-44 bg-elevated/50 rounded-t-2xl" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-elevated/50 rounded-full w-3/4" />
        <div className="h-4 bg-elevated/50 rounded-full w-1/2" />
        <div className="h-2.5 bg-elevated/50 rounded-full w-full" />
        <div className="h-9 bg-elevated/50 rounded-xl w-full mt-2" />
      </div>
    </div>
  );
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────
function StatsBar({ markets }) {
  const tvl    = markets.reduce((a) => a + 0, 0).toFixed(2);
  const active = markets.filter(m => !m.resolved).length;
  const stats  = [
    { label:'TOTAL TVL',       value:`${tvl} SHM`, icon:'🔒', color:'text-gold'    },
    { label:'ACTIVE MARKETS',  value:active,        icon:'📊', color:'text-yes'     },
    { label:'TOTAL MARKETS',   value:markets.length, icon:'🌐', color:'text-primary' },
    { label:'TOTAL BETTORS',   value:'—',           icon:'👥', color:'text-no'      },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map(({ label, value, icon, color }, i) => (
        <motion.div
          key={label}
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ delay: i * 0.1 }}
          className="glass-card p-5"
        >
          <div className="text-2xl mb-2">{icon}</div>
          <div className={`font-display text-3xl font-bold ${color} mb-1`}>{value}</div>
          <div className="text-secondary text-xs font-mono tracking-widest uppercase">{label}</div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Live Feed ─────────────────────────────────────────────────────────────────
function LiveFeed() {
  const [items,  setItems]  = useState(MOCK_ACTIONS);
  const [newIdx, setNewIdx] = useState(null);
  const timer = useRef();

  useEffect(() => {
    timer.current = setInterval(() => {
      const next = { ...MOCK_ACTIONS[Math.floor(Math.random() * MOCK_ACTIONS.length)], _id: Date.now(), ago: 0 };
      setItems(prev => [next, ...prev.slice(0, 9)]);
      setNewIdx(0);
      setTimeout(() => setNewIdx(null), 1200);
    }, 3500);
    return () => clearInterval(timer.current);
  }, []);

  return (
    <aside className="w-56 flex-shrink-0 sticky top-20 h-fit">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-no animate-pulse" />
        <span className="font-display text-sm font-semibold tracking-widest text-secondary uppercase">Live Activity</span>
      </div>
      <div className="space-y-2 overflow-y-auto max-h-[600px]">
        <AnimatePresence>
          {items.map((item, i) => (
            <motion.div
              key={item._id || i}
              initial={{ opacity:0, x:20 }}
              animate={{ opacity:1, x:0 }}
              className={`glass-card p-3 border-l-2 ${item.side === 'YES' ? 'border-yes' : 'border-no'}`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  item.side === 'YES' ? 'bg-yes/10 text-yes' : 'bg-no/10 text-no'
                }`}>{item.side}</span>
                <span className="font-mono text-xs text-secondary truncate flex-1">{item.addr}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-mono text-xs text-gold">{item.amt} SHM</span>
                <span className="text-secondary text-xs">{item.ago}s ago</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </aside>
  );
}

// ── Market Card ───────────────────────────────────────────────────────────────
function MarketCard({ market, index }) {
  const { provider } = useApp();
  const [pools, setPools] = useState({ yes:'0', no:'0', resolved:false, outcome:false });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!provider) return;
    const c = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    c.getMarket(market.marketId)
      .then(r => { setPools({ yes: formatEther(r[1]), no: formatEther(r[2]), resolved: r[3], outcome: r[4] ?? false }); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [provider, market.marketId]);

  const yesF   = parseFloat(pools.yes);
  const noF    = parseFloat(pools.no);
  const total  = (yesF + noF).toFixed(4);
  const yesPct = (yesF + noF) > 0 ? Math.round((yesF / (yesF + noF)) * 100) : 50;
  const noPct  = 100 - yesPct;
  const cat    = market.category || 'Custom';
  const grad   = CATEGORY_GRADIENTS[cat] || CATEGORY_GRADIENTS.Custom;

  const getVerificationBadge = () => {
    if (!market.resolved) return null;
    
    switch (market.verificationStatus) {
      case 'verified':
        return (
          <span className="bg-yes/10 border border-yes/30 text-yes rounded-full px-2 py-0.5 text-xs font-mono flex items-center gap-1">
            ✓ Verified
          </span>
        );
      case 'disputed':
        return (
          <span className="bg-no/10 border border-no/30 text-no rounded-full px-2 py-0.5 text-xs font-mono flex items-center gap-1">
            ⚠ Disputed
          </span>
        );
      case 'verifying':
        return (
          <span className="bg-gold/10 border border-gold/30 text-gold rounded-full px-2 py-0.5 text-xs font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />Verifying
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity:0, y:30 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ y:-6, transition:{ duration:0.2 } }}
      className="glass-card overflow-hidden cursor-pointer group"
    >
      {/* Banner */}
      <div className="relative h-44 overflow-hidden">
        {market.image
          ? <img src={market.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={e => { e.target.style.display='none'; }} />
          : <div className={`w-full h-full bg-gradient-to-br ${grad}`} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
        <div className="absolute top-3 right-3 flex gap-2 flex-wrap justify-end">
          <span className="bg-elevated/80 text-primary border border-primary/30 rounded-full px-2 py-0.5 text-xs font-mono backdrop-blur-sm">
            {cat}
          </span>
          {pools.resolved
            ? <span className="bg-gold/10 border border-gold/30 text-gold rounded-full px-2 py-0.5 text-xs font-mono">
                ✓ {pools.outcome ? 'YES' : 'NO'}
              </span>
            : <span className="bg-yes/10 border border-yes/30 text-yes rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-yes animate-pulse" />OPEN
              </span>
          }
          {getVerificationBadge()}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="font-display text-base font-semibold text-white mb-4 line-clamp-2 leading-snug">
          {market.question}
        </h3>

        {/* Probability bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-yes font-mono">YES {yesPct}%</span>
            <span className="text-no font-mono">NO {noPct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-elevated overflow-hidden flex">
            <motion.div
              className="h-full bg-yes rounded-l-full"
              style={{ boxShadow:'0 0 8px rgba(0,230,118,0.4)' }}
              initial={{ width:0 }}
              animate={{ width: loaded ? `${yesPct}%` : 0 }}
              transition={{ duration:0.8, ease:'easeOut', delay: index * 0.05 }}
            />
            <motion.div
              className="h-full bg-no rounded-r-full"
              style={{ boxShadow:'0 0 8px rgba(255,61,87,0.4)' }}
              initial={{ width:0 }}
              animate={{ width: loaded ? `${noPct}%` : 0 }}
              transition={{ duration:0.8, ease:'easeOut', delay: index * 0.05 }}
            />
          </div>
        </div>

        {/* Pool amounts */}
        <div className="flex justify-between text-xs text-secondary font-mono mb-4">
          <span><span className="text-yes">●</span> {parseFloat(pools.yes).toFixed(4)} SHM</span>
          <span className="text-secondary/60">Vol: {total} SHM</span>
          <span><span className="text-no">●</span> {parseFloat(pools.no).toFixed(4)} SHM</span>
        </div>

        <Link to={`/market/${market.marketId}`}>
          <motion.div
            whileHover={{ scale:1.01 }}
            whileTap={{ scale:0.98 }}
            className="w-full bg-gradient-to-r from-primary to-indigo-700 text-white font-display font-semibold py-2.5 rounded-xl
                       flex items-center justify-center gap-2 text-sm transition-shadow duration-300"
            style={{ boxShadow:'0 4px 14px rgba(91,110,245,0.25)' }}
          >
            View Market
            <motion.span animate={{ x:[0,3,0] }} transition={{ repeat:Infinity, duration:1.5 }}>→</motion.span>
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
}

// ── Home Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { isOwner } = useApp();
  const [markets,  setMarkets]  = useState([]);
  const [category, setCategory] = useState('All');
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(apiUrl('/markets')).then(r => r.json()).then(d => { setMarkets(d); setErr(null); setLoading(false); })
      .catch(() => { setErr('Failed to load markets'); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = category === 'All' ? markets : markets.filter(m => (m.category || 'Custom') === category);

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <StatsBar markets={markets} />

      {/* Category Tabs */}
      <div className="glass-card inline-flex p-1 gap-1 mb-8 rounded-xl">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`relative px-4 py-2 rounded-lg text-sm font-display font-semibold transition-all duration-200 ${
              category === key ? 'text-white' : 'text-secondary hover:text-white'
            }`}
          >
            {category === key && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-primary rounded-lg"
                style={{ boxShadow:'0 0 20px rgba(91,110,245,0.4)' }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          {err && <p className="text-no mb-4 text-sm">{err}</p>}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0,1,2].map(i => <MarketCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity:0, scale:0.95 }}
              animate={{ opacity:1, scale:1 }}
              className="col-span-full text-center py-20 glass-card"
            >
              <div className="text-6xl mb-4">🔮</div>
              <h3 className="font-display text-xl text-white mb-2">No markets yet</h3>
              <p className="text-secondary mb-6">Be the first to create a prediction market</p>
              {isOwner && (
                <Link to="/create" className="btn-primary inline-block">🚀 Create Market</Link>
              )}
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
            >
              {filtered.map((m, i) => <MarketCard key={m._id} market={m} index={i} />)}
            </motion.div>
          )}
        </div>
        <LiveFeed />
      </div>
    </main>
  );
}
